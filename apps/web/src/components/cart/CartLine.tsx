import { type CartItem, type Product } from '@/api';
import { QtyStepper } from '@/components/ui';
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
        <QtyStepper
          value={item.quantity}
          busy={busy}
          onDecrease={() => onQty(item.quantity - 1)}
          onIncrease={() => onQty(item.quantity + 1)}
        />
      </td>
      <td className="align-middle text-end font-monospace text-muted">
        {product ? money(product.price * item.quantity) : '—'}
      </td>
    </tr>
  );
}
