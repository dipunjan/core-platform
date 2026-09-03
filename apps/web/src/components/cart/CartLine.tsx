import { money, type CartItem, type Product } from '@/api';
import { Button } from '@/components/ui';

type Props = {
  item: CartItem;
  product?: Product;
  busy: boolean;
  onQty: (quantity: number) => void;
};

export function CartLine({ item, product, busy, onQty }: Props) {
  return (
    <tr>
      <td>{product?.name ?? item.productId}</td>
      <td className="row">
        <Button
          variant="secondary"
          type="button"
          disabled={busy}
          onClick={() => onQty(item.quantity - 1)}
        >
          −
        </Button>
        {item.quantity}
        <Button
          variant="secondary"
          type="button"
          disabled={busy}
          onClick={() => onQty(item.quantity + 1)}
        >
          +
        </Button>
      </td>
      <td>{product ? money(product.price * item.quantity) : '—'}</td>
    </tr>
  );
}
