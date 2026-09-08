import { docId, type Order, type Product } from '@/api';
import { Button, Card } from '@/components/ui';
import { useMoney } from '@/hooks';

type Props = {
  order: Order;
  productsById: Map<string, Product>;
  busy: boolean;
  onCancel: (id: string) => void;
};

export function OrderCard({ order, productsById, busy, onCancel }: Props) {
  const money = useMoney();
  const id = docId(order);
  return (
    <Card className="mb-3" padding="sm">
      <p className="d-flex flex-wrap align-items-baseline gap-2 mb-0">
        <strong className="text-capitalize">{order.status}</strong>
        <span className="text-muted small">· {money(order.total)}</span>
      </p>
      {order.shippingAddress ? (
        <p className="mt-3 mb-0 text-muted small">
          Ship to {order.shippingAddress.line1}, {order.shippingAddress.city},{' '}
          {order.shippingAddress.region} {order.shippingAddress.postalCode}
        </p>
      ) : null}
      <ul className="mt-3 mb-0 ps-3 text-muted small">
        {order.items.map((item) => {
          const product = productsById.get(item.productId);
          const label = product?.name ?? item.productId;
          return (
            <li key={item.productId}>
              {item.quantity} × {label} @ {money(item.unitPrice)}
            </li>
          );
        })}
      </ul>
      {order.status === 'pending' ? (
        <Button
          variant="danger"
          type="button"
          className="mt-3"
          loading={busy}
          loadingLabel="Cancelling…"
          onClick={() => onCancel(id)}
        >
          Cancel order
        </Button>
      ) : null}
    </Card>
  );
}
