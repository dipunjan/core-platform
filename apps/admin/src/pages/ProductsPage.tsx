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
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Products</h1>
      <Flash tone="success">{notice}</Flash>
      <Flash>{error}</Flash>

      <form
        onSubmit={(event) => void create(event)}
        noValidate
        className="mb-8 max-w-xl rounded-xl border border-zinc-200 bg-white p-6"
      >
        <h2 className="mb-2 text-lg font-semibold">Add product</h2>
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
        <div className="mb-4">
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <Field
              className="mb-0"
              label="Price (cents)"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              error={fieldErrors.price}
              required
            />
            <SelectField
              className="mb-0"
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
          {!fieldErrors.price ? (
            <p className="mt-1.5 text-xs font-normal text-zinc-500">
              Whole cents only. 1299 = $12.99.
            </p>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          Featured on the home page
        </label>
        <div>
          <Button type="submit" loading={saving} disabled={categories.length === 0}>
            Add product
          </Button>
          {categories.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">
              Create a category first, then you can add products.
            </p>
          ) : null}
        </div>
      </form>

      {editingId ? (
        <section
          ref={editPanelRef}
          className="mb-8 max-w-xl rounded-xl border border-emerald-200 bg-emerald-50/40 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">Edit product</h2>
          <form
            onSubmit={(event) => void saveEdit(event)}
            noValidate
            className="flex flex-col"
          >
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
            <div className="mb-4">
              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                <Field
                  className="mb-0"
                  label="Price (cents)"
                  type="number"
                  min={0}
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  error={editErrors.price}
                  required
                />
                <SelectField
                  className="mb-0"
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
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={editForm.featured}
                onChange={(e) =>
                  setEditForm({ ...editForm, featured: e.target.checked })
                }
              />
              Featured on the home page
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={editSaving}>
                Save changes
              </Button>
              <Button type="button" variant="secondary" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-500" colSpan={5}>
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
                    className={`border-b border-zinc-100 ${editing ? 'bg-emerald-50/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <strong>{product.name}</strong>
                      <p className="text-xs text-zinc-500">{product.sku}</p>
                    </td>
                    <td className="px-4 py-3">{categoryName(product.category)}</td>
                    <td className="px-4 py-3 tabular-nums">{money(product.price)}</td>
                    <td className="px-4 py-3">
                      {product.featured ? 'Yes' : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
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
