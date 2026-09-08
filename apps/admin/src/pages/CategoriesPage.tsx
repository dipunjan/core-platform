import { useEffect, useRef, useState, type FormEvent } from 'react';
import { apiMessage, docId, http, urls, type Category } from '@/api';
import { Button, Field, Flash, PageHeader, PageLoader } from '@/components/ui';
import { confirmAction } from '@/lib/confirm';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type CategoryForm = {
  slug: string;
  name: string;
  blurb: string;
  showInNav: boolean;
  showOnHome: boolean;
};

const emptyForm = (): CategoryForm => ({
  slug: '',
  name: '',
  blurb: '',
  showInNav: true,
  showOnHome: true,
});

export function CategoriesPage() {
  const editPanelRef = useRef<HTMLElement>(null);
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState<CategoryForm>(emptyForm());
  const [slugError, setSlugError] = useState('');
  const [nameError, setNameError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState<CategoryForm>(emptyForm());
  const [editNameError, setEditNameError] = useState('');

  async function reload() {
    const { data } = await http.get<Category[]>(urls.categories);
    setRows(data);
  }

  useEffect(() => {
    setLoading(true);
    void reload()
      .catch((err) => setError(apiMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (editingId && editPanelRef.current) {
      editPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [editingId]);

  function validateCreate() {
    const nextSlug = form.slug.trim().toLowerCase();
    const nextName = form.name.trim();
    let ok = true;
    setSlugError('');
    setNameError('');
    if (!nextName) {
      setNameError('Enter a display name, e.g. Shoes.');
      ok = false;
    }
    if (!nextSlug) {
      setSlugError('Enter a slug, e.g. shoes.');
      ok = false;
    } else if (!SLUG_RE.test(nextSlug)) {
      setSlugError('Use lowercase letters, numbers, and hyphens only.');
      ok = false;
    }
    return ok;
  }

  function validateEdit() {
    const nextName = editForm.name.trim();
    setEditNameError('');
    if (!nextName) {
      setEditNameError('Enter a display name.');
      return false;
    }
    return true;
  }

  function startEdit(row: Category) {
    setError('');
    setNotice('');
    setEditingId(docId(row));
    setEditForm({
      slug: row.slug,
      name: row.name,
      blurb: row.blurb ?? '',
      showInNav: row.showInNav,
      showOnHome: row.showOnHome,
    });
    setEditNameError('');
  }

  function cancelEdit() {
    setEditingId('');
    setEditForm(emptyForm());
    setEditNameError('');
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!validateCreate()) {
      setError('Fix the highlighted fields and try again.');
      return;
    }
    setSaving(true);
    try {
      await http.post(urls.categories, {
        slug: form.slug.trim().toLowerCase(),
        name: form.name.trim(),
        blurb: form.blurb.trim(),
        showInNav: form.showInNav,
        showOnHome: form.showOnHome,
      });
      setForm(emptyForm());
      setNotice('Category added.');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!validateEdit()) {
      setError('Fix the highlighted fields and try again.');
      return;
    }
    setEditSaving(true);
    try {
      await http.patch(urls.category(editingId), {
        name: editForm.name.trim(),
        blurb: editForm.blurb.trim(),
        showInNav: editForm.showInNav,
        showOnHome: editForm.showOnHome,
      });
      setNotice('Category updated.');
      cancelEdit();
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setEditSaving(false);
    }
  }

  async function remove(row: Category) {
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
      await http.delete(urls.category(docId(row)));
      setNotice('Category removed.');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  if (loading) {
    return <PageLoader label="Loading categories…" />;
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Taxonomy only. Featured is a product flag, not a category."
      />
      <Flash tone="success">{notice}</Flash>
      <Flash>{error}</Flash>
      <form
        onSubmit={(event) => void create(event)}
        className="card mb-4"
        style={{ maxWidth: '36rem' }}
      >
        <div className="card-body">
          <h2 className="admin-section-title mb-3">Add category</h2>
          <Field
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            error={slugError}
            hint="URL-friendly id, e.g. shoes or new-arrivals."
            required
          />
          <Field
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={nameError}
            required
          />
          <Field
            label="Blurb"
            value={form.blurb}
            onChange={(e) => setForm({ ...form, blurb: e.target.value })}
            hint="Short line shown on the shop home page."
          />
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="show-in-nav"
              checked={form.showInNav}
              onChange={(e) => setForm({ ...form, showInNav: e.target.checked })}
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
              onChange={(e) => setForm({ ...form, showOnHome: e.target.checked })}
            />
            <label className="form-check-label" htmlFor="show-on-home">
              Show on home page
            </label>
          </div>
          <Button type="submit" loading={saving}>Add category</Button>
        </div>
      </form>

      {editingId ? (
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
                value={editForm.slug}
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
                <Button type="submit" loading={editSaving}>Save changes</Button>
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
                      onClick={() => void remove(row)}
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
