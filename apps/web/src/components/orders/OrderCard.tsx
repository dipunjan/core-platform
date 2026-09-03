import { docId, money, type Order } from '@/api';
import { Button } from '@/components/ui';

type Props = {
  order: Order;
  busy: boolean;
  onCancel: (id: string) => void;
};

export function OrderCard({ order, busy, onCancel }: Props) {
  const id = docId(order);
  return (
    <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="flex flex-wrap items-baseline gap-2">
        <strong className="capitalize text-zinc-900">{order.status}</strong>
        <span className="text-sm text-zinc-500">· {money(order.total)}</span>
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-600">
        {order.items.map((item) => (
          <li key={item.productId}>
            {item.quantity} × {item.productId} @ {money(item.unitPrice)}
          </li>
        ))}
      </ul>
      {order.status === 'pending' ? (
        <Button
          variant="danger"
          type="button"
          className="mt-4"
          disabled={busy}
          onClick={() => onCancel(id)}
        >
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
