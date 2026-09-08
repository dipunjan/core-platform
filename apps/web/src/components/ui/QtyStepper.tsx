import { Button } from './Button';

type Props = {
  value: number;
  disabled?: boolean;
  busy?: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  /** Shown between − and + (e.g. "2 in cart" or "2"). */
  label?: string;
};

export function QtyStepper({
  value,
  disabled = false,
  busy = false,
  onDecrease,
  onIncrease,
  label,
}: Props) {
  const inactive = disabled || busy;

  return (
    <div className="d-flex align-items-center gap-2">
      <Button
        variant="secondary"
        type="button"
        className="px-2"
        style={{ width: '2rem', height: '2rem' }}
        disabled={inactive}
        title={busy ? 'Updating…' : 'Decrease quantity'}
        onClick={onDecrease}
      >
        −
      </Button>
      <span
        className="text-center small fw-semibold font-monospace"
        style={{ minWidth: label ? '4.5rem' : '1.5rem' }}
        aria-live="polite"
      >
        {label ?? value}
      </span>
      <Button
        variant="secondary"
        type="button"
        className="px-2"
        style={{ width: '2rem', height: '2rem' }}
        disabled={inactive}
        title={busy ? 'Updating…' : 'Increase quantity'}
        onClick={onIncrease}
      >
        +
      </Button>
    </div>
  );
}
