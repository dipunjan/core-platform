import { useEffect, useState, type FormEvent } from 'react';
import { apiMessage, docId, http, urls, type Category, type Product } from '@/api';
import { Button, Field, Flash } from '@/components/ui';
import { useMoney } from '@/hooks';

const empty = {
  name: '',
  description: '',
  price: '1299',
  sku: '',
  category: '',
  featured: false,
};

export function ProductsPage() {
  const money = useMoney();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

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
    void reload().catch((err) => setError(apiMessage(err)));
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await http.post(urls.products, {
        ...form,
        price: Number(form.price),
      });
      setForm({ ...empty, category: form.category });
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function toggleFeatured(product: Product) {
    setError('');
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
    try {
      await http.patch(urls.product(docId(product)), { category });
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function remove(product: Product) {
    setError('');
    try {
      await http.delete(urls.product(docId(product)));
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Products</h1>
      <Flash>{error}</Flash>
      <form
        onSubmit={(event) => void create(event)}
        className="mb-8 grid max-w-2xl gap-0 rounded-xl border border-zinc-200 bg-white p-6 sm:grid-cols-2 sm:gap-x-4"
      >
        <Field
          label="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Field
          label="SKU"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
          required
        />
        <label className="mb-4 grid gap-1.5 text-sm font-medium text-zinc-700 sm:col-span-2">
          Description
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </label>
        <Field
          label="Price (minor units, e.g. cents)"
          type="number"
          min={0}
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <label className="mb-4 grid gap-1.5 text-sm font-medium text-zinc-700">
          Category
          <select
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          >
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          Featured
        </label>
        <div className="sm:col-span-2">
          <Button type="submit">Add product</Button>
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
            {products.map((product) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
