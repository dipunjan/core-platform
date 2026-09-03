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
    <div className="card" style={{ marginBottom: '1rem' }}>
      <p>
        <strong>{order.status}</strong>
        <span className="muted"> · {money(order.total)}</span>
      </p>
      <ul>
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
          disabled={busy}
          onClick={() => onCancel(id)}
        >
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
