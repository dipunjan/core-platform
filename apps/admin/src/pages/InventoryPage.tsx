import { useEffect, useState } from 'react';
import {
  apiMessage,
  docId,
  http,
  urls,
  type Inventory,
  type Product,
} from '@/api';
import { Button, Flash } from '@/components/ui';

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<Inventory[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

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
    void reload().catch((err) => setError(apiMessage(err)));
  }, []);

  async function save(productId: string) {
    setError('');
    try {
      await http.put(urls.inventoryItem(productId), {
        quantity: Number(draft[productId] ?? 0),
      });
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  const byId = new Map(stock.map((row) => [row.productId, row]));

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Inventory</h1>
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
            {products.map((product) => {
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
                      className="w-24 rounded-md border border-zinc-300 px-2 py-1"
                      value={draft[id] ?? '0'}
                      onChange={(e) =>
                        setDraft({ ...draft, [id]: e.target.value })
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Button type="button" onClick={() => void save(id)}>
                      Save
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
