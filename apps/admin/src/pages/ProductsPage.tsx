import { useEffect, useState, type FormEvent } from 'react';
import { apiMessage, docId, http, urls, type Category, type Product } from '@/api';
import { Button, Field, Flash, PageLoader } from '@/components/ui';
import { useMoney } from '@/hooks';

const empty = {
  name: '',
  description: '',
  price: '1299',
  sku: '',
  category: '',
  featured: false,
};

type FieldErrors = Partial<Record<'name' | 'sku' | 'description' | 'price' | 'category', string>>;

function validateForm(form: typeof empty): FieldErrors {
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

export function ProductsPage() {
  const money = useMoney();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(empty);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      setForm({ ...empty, category: form.category });
      setFieldErrors({});
      setNotice('Product added.');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeatured(product: Product) {
    setError('');
    setNotice('');
    try {
      await http.patch(urls.product(docId(product)), {
        featured: !product.featured,
      });
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function assignCategory(product: Product, category: string) {
    setError('');
    setNotice('');
    try {
      await http.patch(urls.product(docId(product)), { category });
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function remove(product: Product) {
    setError('');
    setNotice('');
    try {
      await http.delete(urls.product(docId(product)));
      setNotice('Product removed.');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
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
        className="mb-8 grid max-w-2xl gap-0 rounded-xl border border-zinc-200 bg-white p-6 sm:grid-cols-2 sm:gap-x-4"
      >
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
        <label className="mb-4 grid gap-1.5 text-sm font-medium text-zinc-700 sm:col-span-2">
          Description
          <input
            className={`rounded-lg border bg-white px-3 py-2 font-normal text-zinc-900 shadow-sm outline-none focus:ring-2 ${
              fieldErrors.description
                ? 'border-red-400 focus:border-red-600 focus:ring-red-600/20'
                : 'border-zinc-300 focus:border-emerald-700 focus:ring-emerald-700/20'
            }`}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          {fieldErrors.description ? (
            <span className="text-xs font-normal text-red-700">
              {fieldErrors.description}
            </span>
          ) : null}
        </label>
        <Field
          label="Price (cents)"
          type="number"
          min={0}
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          error={fieldErrors.price}
          hint="Whole cents only. 1299 = $12.99."
          required
        />
        <label className="mb-4 grid gap-1.5 text-sm font-medium text-zinc-700">
          Category
          <select
            className={`rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 ${
              fieldErrors.category
                ? 'border-red-400 focus:border-red-600 focus:ring-red-600/20'
                : 'border-zinc-300 focus:border-emerald-700 focus:ring-emerald-700/20'
            }`}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          >
            {categories.length === 0 ? (
              <option value="">Add a category first</option>
            ) : (
              categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))
            )}
          </select>
          {fieldErrors.category ? (
            <span className="text-xs font-normal text-red-700">
              {fieldErrors.category}
            </span>
          ) : null}
        </label>
        <label className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          Featured on the home page
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving} disabled={categories.length === 0}>
            Add product
          </Button>
        </div>
      </form>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3" />
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
              products.map((product) => (
                <tr key={docId(product)} className="border-b border-zinc-100">
                  <td className="px-4 py-3">
                    <strong>{product.name}</strong>
                    <p className="text-xs text-zinc-500">{product.sku}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-zinc-300 px-2 py-1"
                      value={product.category}
                      onChange={(e) => void assignCategory(product, e.target.value)}
                    >
                      {categories.map((category) => (
                        <option key={category.slug} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{money(product.price)}</td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={Boolean(product.featured)}
                      onChange={() => void toggleFeatured(product)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => void remove(product)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
