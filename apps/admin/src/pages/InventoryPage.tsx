import { useEffect, useState } from 'react';
import {
  apiMessage,
  docId,
  http,
  urls,
  type Inventory,
  type Product,
} from '@/api';
import { Button, Flash, PageLoader } from '@/components/ui';

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<Inventory[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function reload() {
    const [p, i] = await Promise.all([
      http.get<Product[]>(urls.products),
      http.get<Inventory[]>(urls.inventory),
    ]);
    setProducts(p.data);
    setStock(i.data);
    const next: Record<string, string> = {};
    for (const row of i.data) {
      next[row.productId] = String(row.quantity);
    }
    setDraft(next);
  }

  useEffect(() => {
    setLoading(true);
    void reload()
      .catch((err) => setError(apiMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function save(productId: string) {
    setError('');
    setNotice('');
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    const raw = draft[productId] ?? '0';
    const quantity = Number(raw);
    if (raw === '' || Number.isNaN(quantity) || quantity < 0) {
      setRowErrors((prev) => ({
        ...prev,
        [productId]: 'Enter a whole number, 0 or higher.',
      }));
      return;
    }
    setSavingId(productId);
    try {
      await http.put(urls.inventoryItem(productId), { quantity });
      setNotice('Stock updated.');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSavingId('');
    }
  }

  const byId = new Map(stock.map((row) => [row.productId, row]));

  if (loading) {
    return <PageLoader label="Loading inventory…" />;
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Inventory</h1>
      <Flash tone="success">{notice}</Flash>
      <Flash>{error}</Flash>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">On hand</th>
              <th className="px-4 py-3">Reserved</th>
              <th className="px-4 py-3">Set quantity</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-500" colSpan={5}>
                  No products yet. Add products first, then set stock here.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const id = docId(product);
                const row = byId.get(id);
                return (
                  <tr key={id} className="border-b border-zinc-100">
                    <td className="px-4 py-3">
                      <strong>{product.name}</strong>
                      <p className="text-xs text-zinc-500">{product.sku}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row?.quantity ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{row?.reserved ?? '—'}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        className={`w-24 rounded-md border px-2 py-1 ${
                          rowErrors[id]
                            ? 'border-red-400'
                            : 'border-zinc-300'
                        }`}
                        value={draft[id] ?? '0'}
                        onChange={(e) =>
                          setDraft({ ...draft, [id]: e.target.value })
                        }
                      />
                      {rowErrors[id] ? (
                        <p className="mt-1 text-xs text-red-700">{rowErrors[id]}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        loading={savingId === id}
                        onClick={() => void save(id)}
                      >
                        Save
                      </Button>
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
