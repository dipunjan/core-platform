import { useEffect, useState } from 'react';
import { queryError, docId, type Product } from '@/api';
import { Button, Flash, PageHeader, PageLoader } from '@/components/ui';
import {
  useInventoryQuery,
  useProductsQuery,
  useUpdateInventoryMutation,
} from '@/query';

export function InventoryPage() {
  const productsQuery = useProductsQuery();
  const inventoryQuery = useInventoryQuery();
  const updateInventory = useUpdateInventoryMutation();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const products = productsQuery.data ?? [];
  const stock = inventoryQuery.data ?? [];
  const loading = productsQuery.isLoading || inventoryQuery.isLoading;
  const error = queryError(
    productsQuery.error ?? inventoryQuery.error ?? updateInventory.error,
  );

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const row of stock) {
      next[row.productId] = String(row.quantity);
    }
    setDraft(next);
  }, [stock]);

  async function save(productId: string) {
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
    try {
      await updateInventory.mutateAsync({ productId, quantity });
      setNotice('Stock updated.');
    } catch {
      /* error on mutation */
    }
  }

  const byId = new Map(stock.map((row) => [row.productId, row]));

  if (loading) {
    return <PageLoader label="Loading inventory…" />;
  }

  return (
    <>
      <PageHeader title="Inventory" />
      <Flash tone="success">{notice}</Flash>
      <Flash>{error}</Flash>
      <div className="card admin-table-card">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Product</th>
              <th>On hand</th>
              <th>Reserved</th>
              <th>Set quantity</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="text-center text-muted py-5" colSpan={5}>
                  No products yet. Add products first, then set stock here.
                </td>
              </tr>
            ) : (
              products.map((product: Product) => {
                const id = docId(product);
                const row = byId.get(id);
                return (
                  <tr key={id}>
                    <td>
                      <strong>{product.name}</strong>
                      <p className="small text-muted mb-0">{product.sku}</p>
                    </td>
                    <td className="font-monospace">{row?.quantity ?? '—'}</td>
                    <td className="font-monospace">{row?.reserved ?? '—'}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        className={`form-control form-control-sm${rowErrors[id] ? ' is-invalid' : ''}`}
                        style={{ width: '6rem' }}
                        value={draft[id] ?? '0'}
                        onChange={(e) =>
                          setDraft({ ...draft, [id]: e.target.value })
                        }
                      />
                      {rowErrors[id] ? (
                        <div className="invalid-feedback d-block">{rowErrors[id]}</div>
                      ) : null}
                    </td>
                    <td>
                      <Button
                        type="button"
                        loading={updateInventory.isPending}
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
