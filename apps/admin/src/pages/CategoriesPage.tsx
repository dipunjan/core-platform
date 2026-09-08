import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { docId, queryError, type Category } from '@/api';
import { Button, Field, Flash, PageHeader, PageLoader } from '@/components/ui';
import { confirmAction } from '@/lib/confirm';
import {
  categoryCreateSchema,
  categoryEditSchema,
  type CategoryCreateValues,
  type CategoryEditValues,
} from '@/lib/schemas';
import { useCategoriesQuery, useCategoryMutations } from '@/query';

const emptyForm = (): CategoryCreateValues => ({
  slug: '',
  name: '',
  blurb: '',
  showInNav: true,
  showOnHome: true,
});

export function CategoriesPage() {
  const editPanelRef = useRef<HTMLElement>(null);
  const categoriesQuery = useCategoriesQuery();
  const { create, update, remove } = useCategoryMutations();
  const rows = categoriesQuery.data ?? [];
  const loading = categoriesQuery.isLoading;
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const createForm = useForm<CategoryCreateValues>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: emptyForm(),
  });
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState<CategoryEditValues | null>(null);
  const [editNameError, setEditNameError] = useState('');

  useEffect(() => {
    if (editingId && editPanelRef.current) {
      editPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [editingId]);

  function startEdit(row: Category) {
    setError('');
    setNotice('');
    setEditingId(docId(row));
    setEditForm({
      name: row.name,
      blurb: row.blurb ?? '',
      showInNav: row.showInNav,
      showOnHome: row.showOnHome,
    });
    setEditNameError('');
  }

  function cancelEdit() {
    setEditingId('');
    setEditForm(null);
    setEditNameError('');
  }

  async function onCreate(values: CategoryCreateValues) {
    setError('');
    setNotice('');
    try {
      await create.mutateAsync({
        slug: values.slug.trim().toLowerCase(),
        name: values.name.trim(),
        blurb: values.blurb.trim(),
        showInNav: values.showInNav,
        showOnHome: values.showOnHome,
      });
      createForm.reset(emptyForm());
      setNotice('Category added.');
    } catch (err) {
      setError(queryError(err, 'Could not add category'));
    }
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editForm) {
      return;
    }
    setError('');
    setNotice('');
    const parsed = categoryEditSchema.safeParse(editForm);
    if (!parsed.success) {
      setEditNameError(parsed.error.issues[0]?.message ?? 'Enter a display name.');
      setError('Fix the highlighted fields and try again.');
      return;
    }
    try {
      await update.mutateAsync({
        id: editingId,
        body: {
          name: parsed.data.name.trim(),
          blurb: parsed.data.blurb.trim(),
          showInNav: parsed.data.showInNav,
          showOnHome: parsed.data.showOnHome,
        },
      });
      setNotice('Category updated.');
      cancelEdit();
    } catch (err) {
      setError(queryError(err, 'Could not update category'));
    }
  }

  async function removeRow(row: Category) {
    if (
      !confirmAction(
        `Delete category "${row.name}"? Products using this category may need updating.`,
      )
    ) {
      return;
    }
    setError('');
    setNotice('');
    try {
      if (editingId === docId(row)) {
        cancelEdit();
      }
      await remove.mutateAsync(docId(row));
      setNotice('Category removed.');
    } catch (err) {
      setError(queryError(err, 'Could not delete category'));
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors: createErrors, isSubmitting },
    watch,
    setValue,
  } = createForm;
  const form = watch();

  if (loading) {
    return <PageLoader label="Loading categories…" />;
  }

  return (
    <>
      <PageHeader title="Categories" />
      <Flash tone="success">{notice}</Flash>
      <Flash>{error}</Flash>
      <form
        onSubmit={(event) => void handleSubmit(onCreate)(event)}
        className="card mb-4"
        style={{ maxWidth: '36rem' }}
      >
        <div className="card-body">
          <h2 className="admin-section-title mb-3">Add category</h2>
          <Field
            label="Slug"
            {...register('slug')}
            error={createErrors.slug?.message}
            hint="URL-friendly id, e.g. shoes or new-arrivals."
            required
          />
          <Field
            label="Name"
            {...register('name')}
            error={createErrors.name?.message}
            required
          />
          <Field
            label="Blurb"
            {...register('blurb')}
            hint="Short line shown on the shop home page."
          />
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="show-in-nav"
              checked={form.showInNav}
              onChange={(e) => setValue('showInNav', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="show-in-nav">
              Show in shop navigation
            </label>
          </div>
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="show-on-home"
              checked={form.showOnHome}
              onChange={(e) => setValue('showOnHome', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="show-on-home">
              Show on home page
            </label>
          </div>
          <Button type="submit" loading={isSubmitting}>Add category</Button>
        </div>
      </form>

      {editingId && editForm ? (
        <section
          ref={editPanelRef}
          className="card mb-4 admin-panel-edit"
          style={{ maxWidth: '36rem' }}
        >
          <div className="card-body">
            <h2 className="admin-section-title mb-3">Edit category</h2>
            <form onSubmit={(event) => void saveEdit(event)}>
              <Field
                label="Slug"
                value={rows.find((row) => docId(row) === editingId)?.slug ?? ''}
                readOnly
                hint="Slug is fixed after creation. Products reference it."
              />
              <Field
                label="Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                error={editNameError}
                required
              />
              <Field
                label="Blurb"
                value={editForm.blurb}
                onChange={(e) => setEditForm({ ...editForm, blurb: e.target.value })}
                hint="Short line shown on the shop home page."
              />
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="edit-show-in-nav"
                  checked={editForm.showInNav}
                  onChange={(e) =>
                    setEditForm({ ...editForm, showInNav: e.target.checked })
                  }
                />
                <label className="form-check-label" htmlFor="edit-show-in-nav">
                  Show in shop navigation
                </label>
              </div>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="edit-show-on-home"
                  checked={editForm.showOnHome}
                  onChange={(e) =>
                    setEditForm({ ...editForm, showOnHome: e.target.checked })
                  }
                />
                <label className="form-check-label" htmlFor="edit-show-on-home">
                  Show on home page
                </label>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Button type="submit" loading={update.isPending}>Save changes</Button>
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <ul className="list-unstyled d-grid gap-3" style={{ maxWidth: '36rem' }}>
        {rows.length === 0 ? (
          <li className="card border-dashed text-center text-muted py-5">
            <div className="card-body">No categories yet. Add one above.</div>
          </li>
        ) : (
          rows.map((row) => {
            const id = docId(row);
            const editing = editingId === id;
            return (
              <li
                key={row.slug}
                className={`card card-hover${editing ? ' admin-panel-edit' : ''}`}
              >
                <div className="card-body d-flex align-items-center justify-content-between gap-3">
                  <div>
                    <strong>{row.name}</strong>
                    <p className="small text-muted mb-0">{row.slug}</p>
                    {row.blurb ? (
                      <p className="small mb-0 mt-1">{row.blurb}</p>
                    ) : null}
                  </div>
                  <div className="d-flex flex-shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => startEdit(row)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => void removeRow(row)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </>
  );
}
