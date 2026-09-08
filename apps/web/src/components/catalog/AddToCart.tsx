import { Button, QtyStepper } from '@/components/ui';
import { useCart } from '@/hooks';

type Props = {
  productId: string;
  disabled?: boolean;
  /** Full-width layout on product grid cards. */
  block?: boolean;
};

/**
 * Catalog buy box: “Add to cart” when qty is 0, otherwise a quantity stepper.
 * Used on product cards and the product detail page (not on the cart page).
 */
export function AddToCart({ productId, disabled = false, block = false }: Props) {
  const { qtyFor, addItem, setQty, mutating } = useCart();
  const qty = qtyFor(productId);
  const busy = mutating || disabled;

  if (qty === 0) {
    return (
      <Button
        type="button"
        className={block ? 'w-100' : undefined}
        loading={mutating}
        loadingLabel="Adding…"
        disabled={disabled}
        onClick={() => void addItem(productId, 1)}
      >
        Add to cart
      </Button>
    );
  }

  return (
    <div className={block ? 'd-flex justify-content-center w-100' : undefined}>
      <QtyStepper
        value={qty}
        label={`${qty} in cart`}
        busy={busy}
        onDecrease={() => setQty(productId, qty - 1)}
        onIncrease={() => setQty(productId, qty + 1)}
      />
    </div>
  );
}
