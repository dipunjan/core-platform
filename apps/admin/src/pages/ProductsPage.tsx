import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { docId, queryError, type Category, type Product } from '@/api';
import {
  Button,
  Field,
  Flash,
  PageHeader,
  PageLoader,
  SelectField,
  TextAreaField,
} from '@/components/ui';
import { confirmAction } from '@/lib/confirm';
import { productSchema, type ProductFormValues } from '@/lib/schemas';
import { useMoney } from '@/hooks';
import {
  useCategoriesQuery,
  useProductMutations,
  useProductsQuery,
} from '@/query';

type FieldErrors = Partial<
  Record<'name' | 'sku' | 'description' | 'price' | 'category', string>
>;

function productToForm(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description,
    price: product.price,
    sku: product.sku,
    category: product.category,
    featured: Boolean(product.featured),
  };
}

export function ProductsPage() {
  const money = useMoney();
  const editPanelRef = useRef<HTMLElement>(null);
  const productsQuery = useProductsQuery();
  const categoriesQuery = useCategoriesQuery();
  const { create, update, remove } = useProductMutations();
  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const loading = productsQuery.isLoading || categoriesQuery.isLoading;

  const createForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 1299,
      sku: '',
      category: '',
      featured: false,
    },
  });

  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState<ProductFormValues | null>(null);
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const first = categories[0]?.slug;
    if (first && !createForm.getValues('category')) {
      createForm.setValue('category', first);
    }
  }, [categories, createForm]);

  useEffect(() => {
    if (editingId && editPanelRef.current) {
      editPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [editingId]);

  function categoryName(slug: string) {
    return categories.find((row) => row.slug === slug)?.name ?? slug;
  }

  function startEdit(product: Product) {
    setError('');
    setNotice('');
    setEditingId(docId(product));
    setEditForm(productToForm(product));
    setEditErrors({});
  }

  function cancelEdit() {
    setEditingId('');
    setEditForm(null);
    setEditErrors({});
  }

  async function onCreate(values: ProductFormValues) {
    setError('');
    setNotice('');
    try {
      await create.mutateAsync({
        ...values,
        name: values.name.trim(),
        sku: values.sku.trim(),
        description: values.description.trim(),
      });
      createForm.reset({
        name: '',
        description: '',
        price: 1299,
        sku: '',
        category: values.category,
        featured: false,
      });
      setNotice('Product added.');
    } catch (err) {
      setError(queryError(err, 'Could not add product'));
    }
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editForm) {
      return;
    }
    setError('');
    setNotice('');
    const parsed = productSchema.safeParse(editForm);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && key in errors === false) {
          errors[key as keyof FieldErrors] = issue.message;
        }
      }
      setEditErrors(errors);
      setError('Fix the highlighted fields and try again.');
      return;
    }
    try {
      await update.mutateAsync({
        id: editingId,
        body: {
          name: parsed.data.name.trim(),
          sku: parsed.data.sku.trim(),
          description: parsed.data.description.trim(),
          price: parsed.data.price,
          category: parsed.data.category,
          featured: parsed.data.featured,
        },
      });
      setNotice('Product updated.');
      cancelEdit();
    } catch (err) {
      setError(queryError(err, 'Could not update product'));
    }
  }

  async function removeProduct(product: Product) {
    if (!confirmAction(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }
    setError('');
    setNotice('');
    try {
      if (editingId === docId(product)) {
        cancelEdit();
      }
      await remove.mutateAsync(docId(product));
      setNotice('Product removed.');
    } catch (err) {
      setError(queryError(err, 'Could not delete product'));
    }
  }

  function categoryOptions() {
    if (categories.length === 0) {
      return <option value="">Add a category first</option>;
    }
    return categories.map((category: Category) => (
      <option key={category.slug} value={category.slug}>
        {category.name}
      </option>
    ));
  }

  if (loading) {
    return <PageLoader label="Loading products…" />;
  }

  const {
    register,
    handleSubmit,
    formState: { errors: createErrors, isSubmitting },
    watch,
    setValue,
  } = createForm;
  const form = watch();

  return (
    <>
      <PageHeader title="Products" />
      <Flash tone="success">{notice}</Flash>
      <Flash>{error}</Flash>

      <form
        onSubmit={(event) => void handleSubmit(onCreate)(event)}
        noValidate
        className="card mb-4"
        style={{ maxWidth: '36rem' }}
      >
        <div className="card-body">
          <h2 className="admin-section-title mb-3">Add product</h2>
          <Field
            label="Name"
            {...register('name')}
            error={createErrors.name?.message}
            required
          />
          <Field
            label="SKU"
            {...register('sku')}
            error={createErrors.sku?.message}
            hint="Unique code for this product, e.g. SWOOP-TEE-01."
            required
          />
          <TextAreaField
            label="Description"
            {...register('description')}
            error={createErrors.description?.message}
            required
          />
          <div className="row">
            <div className="col-md-6">
              <Field
                label="Price (cents)"
                type="number"
                min={0}
                {...register('price', { valueAsNumber: true })}
                error={createErrors.price?.message}
                required
              />
            </div>
            <div className="col-md-6">
              <SelectField
                label="Category"
                {...register('category')}
                error={createErrors.category?.message}
                required
                disabled={categories.length === 0}
              >
                {categoryOptions()}
              </SelectField>
            </div>
          </div>
          {!createErrors.price ? (
            <p className="form-text">Whole cents only. 1299 = $12.99.</p>
          ) : null}
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="featured"
              checked={form.featured}
              onChange={(e) => setValue('featured', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="featured">
              Featured on the home page
            </label>
          </div>
          <div>
            <Button type="submit" loading={isSubmitting} disabled={categories.length === 0}>
              Add product
            </Button>
            {categories.length === 0 ? (
              <p className="mt-2 text-muted small">
                Create a category first, then you can add products.
              </p>
            ) : null}
          </div>
        </div>
      </form>

      {editingId && editForm ? (
        <section
          ref={editPanelRef}
          className="card mb-4 admin-panel-edit"
          style={{ maxWidth: '36rem' }}
        >
          <div className="card-body">
            <h2 className="admin-section-title mb-3">Edit product</h2>
            <form onSubmit={(event) => void saveEdit(event)} noValidate>
              <Field
                label="Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                error={editErrors.name}
                required
              />
              <Field
                label="SKU"
                value={editForm.sku}
                onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                error={editErrors.sku}
                required
              />
              <TextAreaField
                label="Description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                error={editErrors.description}
                required
              />
              <div className="row">
                <div className="col-md-6">
                  <Field
                    label="Price (cents)"
                    type="number"
                    min={0}
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: Number(e.target.value) })
                    }
                    error={editErrors.price}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <SelectField
                    label="Category"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    error={editErrors.category}
                    required
                  >
                    {categoryOptions()}
                  </SelectField>
                </div>
              </div>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="edit-featured"
                  checked={editForm.featured}
                  onChange={(e) =>
                    setEditForm({ ...editForm, featured: e.target.checked })
                  }
                />
                <label className="form-check-label" htmlFor="edit-featured">
                  Featured on the home page
                </label>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Button type="submit" loading={update.isPending}>
                  Save changes
                </Button>
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <div className="card admin-table-card">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Featured</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="text-center text-muted py-5" colSpan={5}>
                  No products yet. Add one above.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const id = docId(product);
                const editing = editingId === id;
                return (
                  <tr
                    key={id}
                    className={editing ? 'table-success' : undefined}
                  >
                    <td>
                      <strong>{product.name}</strong>
                      <p className="small text-muted mb-0">{product.sku}</p>
                    </td>
                    <td>{categoryName(product.category)}</td>
                    <td className="font-monospace">{money(product.price)}</td>
                    <td>
                      {product.featured ? 'Yes' : '—'}
                    </td>
                    <td>
                      <div className="d-flex justify-content-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => startEdit(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => void removeProduct(product)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
