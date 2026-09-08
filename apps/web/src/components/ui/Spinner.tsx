import { cn } from '@/lib/cn';

type Props = {
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
};

export function SpinnerIcon({
  className = '',
  size = 'sm',
}: {
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'spinner-border',
        size === 'sm' ? 'spinner-border-sm' : '',
        className,
      )}
      role="status"
      aria-hidden="true"
    />
  );
}

export function Spinner({
  label = 'Loading…',
  className = '',
  size = 'md',
}: Props) {
  return (
    <div
      className={cn(
        'd-flex align-items-center justify-content-center gap-2 text-muted small',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <SpinnerIcon size={size === 'sm' ? 'sm' : 'md'} />
      <span>{label}</span>
    </div>
  );
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="d-flex align-items-center justify-content-center py-5"
      style={{ minHeight: '40vh' }}
    >
      <Spinner label={label} />
    </div>
  );
}
