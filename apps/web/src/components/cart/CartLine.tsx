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
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="py-3 pr-4 font-medium text-zinc-900">
        {product?.name ?? item.productId}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            type="button"
            className="h-8 w-8 px-0"
            disabled={busy}
            onClick={() => onQty(item.quantity - 1)}
          >
            −
          </Button>
          <span className="w-6 text-center text-sm tabular-nums">
            {item.quantity}
          </span>
          <Button
            variant="secondary"
            type="button"
            className="h-8 w-8 px-0"
            disabled={busy}
            onClick={() => onQty(item.quantity + 1)}
          >
            +
          </Button>
        </div>
      </td>
      <td className="py-3 text-right tabular-nums text-zinc-700">
        {product ? money(product.price * item.quantity) : '—'}
      </td>
    </tr>
  );
}
