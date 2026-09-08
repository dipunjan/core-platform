import { useEffect, useRef, useState, type FormEvent } from 'react';
import { apiMessage, docId, http, urls, type Category, type Product } from '@/api';
import {
  Button,
  Field,
  Flash,
  PageLoader,
  SelectField,
  TextAreaField,
} from '@/components/ui';
import { confirmAction } from '@/lib/confirm';
import { useMoney } from '@/hooks';

type ProductForm = {
  name: string;
  description: string;
  price: string;
  sku: string;
  category: string;
  featured: boolean;
};

const emptyForm = (): ProductForm => ({
  name: '',
  description: '',
  price: '1299',
  sku: '',
  category: '',
  featured: false,
});

type FieldErrors = Partial<
  Record<'name' | 'sku' | 'description' | 'price' | 'category', string>
>;

function validateForm(form: ProductForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) {
    errors.name = 'Enter a product name.';
  }
  if (!form.sku.trim()) {
    errors.sku = 'Enter a SKU (stock-keeping unit).';
  }
  if (!form.description.trim()) {
    errors.description = 'Add a short description shoppers will see.';
  }
  const price = Number(form.price);
  if (form.price === '' || Number.isNaN(price) || price < 0) {
    errors.price = 'Enter a valid price in cents (0 or more).';
  }
  if (!form.category) {
    errors.category = 'Choose a category.';
  }
  return errors;
}

function productToForm(product: Product): ProductForm {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    sku: product.sku,
    category: product.category,
    featured: Boolean(product.featured),
  };
}

export function ProductsPage() {
  const money = useMoney();
  const editPanelRef = useRef<HTMLElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState<ProductForm>(emptyForm());
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function reload() {
    const [p, c] = await Promise.all([
      http.get<Product[]>(urls.products),
      http.get<Category[]>(urls.categories),
    ]);
    setProducts(p.data);
    setCategories(c.data);
    setForm((prev) => ({
      ...prev,
      category: prev.category || c.data[0]?.slug || '',
    }));
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
    setEditForm(emptyForm());
    setEditErrors({});
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Fix the highlighted fields and try again.');
      return;
    }
    setSaving(true);
    try {
      await http.post(urls.products, {
        ...form,
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description.trim(),
        price: Number(form.price),
      });
      setForm({ ...emptyForm(), category: form.category });
      setFieldErrors({});
      setNotice('Product added.');
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
    const errors = validateForm(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Fix the highlighted fields and try again.');
      return;
    }
    setEditSaving(true);
    try {
      await http.patch(urls.product(editingId), {
        name: editForm.name.trim(),
        sku: editForm.sku.trim(),
        description: editForm.description.trim(),
        price: Number(editForm.price),
        category: editForm.category,
        featured: editForm.featured,
      });
      setNotice('Product updated.');
      cancelEdit();
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setEditSaving(false);
    }
  }

  async function remove(product: Product) {
    if (
      !confirmAction(`Delete "${product.name}"? This cannot be undone.`)
    ) {
      return;
    }
    setError('');
    setNotice('');
    try {
      if (editingId === docId(product)) {
        cancelEdit();
      }
      await http.delete(urls.product(docId(product)));
      setNotice('Product removed.');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  function categoryOptions() {
    if (categories.length === 0) {
      return <option value="">Add a category first</option>;
    }
    return categories.map((category) => (
      <option key={category.slug} value={category.slug}>
        {category.name}
      </option>
    ));
  }

  if (loading) {
    return <PageLoader label="Loading products…" />;
  }

  return (
    <>
      <h1 className="h2 mb-4">Products</h1>
      <Flash tone="success">{notice}</Flash>
      <Flash>{error}</Flash>

      <form
        onSubmit={(event) => void create(event)}
        noValidate
        className="card mb-4"
        style={{ maxWidth: '36rem' }}
      >
        <div className="card-body">
          <h2 className="h5 mb-3">Add product</h2>
          <Field
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={fieldErrors.name}
            required
          />
          <Field
            label="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            error={fieldErrors.sku}
            hint="Unique code for this product, e.g. SWOOP-TEE-01."
            required
          />
          <TextAreaField
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            error={fieldErrors.description}
            required
          />
          <div className="row">
            <div className="col-md-6">
              <Field
                label="Price (cents)"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                error={fieldErrors.price}
                required
              />
            </div>
            <div className="col-md-6">
              <SelectField
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                error={fieldErrors.category}
                required
                disabled={categories.length === 0}
              >
                {categoryOptions()}
              </SelectField>
            </div>
          </div>
          {!fieldErrors.price ? (
            <p className="form-text">Whole cents only. 1299 = $12.99.</p>
          ) : null}
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="featured"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            <label className="form-check-label" htmlFor="featured">
              Featured on the home page
            </label>
          </div>
          <div>
            <Button type="submit" loading={saving} disabled={categories.length === 0}>
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

      {editingId ? (
        <section
          ref={editPanelRef}
          className="card mb-4 border-success bg-success-subtle"
          style={{ maxWidth: '36rem' }}
        >
          <div className="card-body">
            <h2 className="h5 mb-3">Edit product</h2>
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
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
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
                <Button type="submit" loading={editSaving}>
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

      <div className="table-responsive card">
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
                          onClick={() => void remove(product)}
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
