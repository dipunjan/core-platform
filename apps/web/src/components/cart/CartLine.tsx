import { type CartItem, type Product } from '@/api';
import { Button } from '@/components/ui';
import { useMoney } from '@/hooks';

type Props = {
  item: CartItem;
  product?: Product;
  busy: boolean;
  onQty: (quantity: number) => void;
};

export function CartLine({ item, product, busy, onQty }: Props) {
  const money = useMoney();
  return (
    <tr>
      <td className="align-middle fw-medium">
        {product?.name ?? item.productId}
      </td>
      <td className="align-middle">
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="secondary"
            type="button"
            className="px-2"
            style={{ width: '2rem', height: '2rem' }}
            disabled={busy}
            title={busy ? 'Updating cart…' : 'Decrease quantity'}
            onClick={() => onQty(item.quantity - 1)}
          >
            −
          </Button>
          <span
            className="text-center small font-monospace"
            style={{ width: '1.5rem' }}
          >
            {item.quantity}
          </span>
          <Button
            variant="secondary"
            type="button"
            className="px-2"
            style={{ width: '2rem', height: '2rem' }}
            disabled={busy}
            title={busy ? 'Updating cart…' : 'Increase quantity'}
            onClick={() => onQty(item.quantity + 1)}
          >
            +
          </Button>
        </div>
      </td>
      <td className="align-middle text-end font-monospace text-muted">
        {product ? money(product.price * item.quantity) : '—'}
      </td>
    </tr>
  );
}
