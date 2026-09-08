type Props = {
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
};

export function SpinnerIcon({
  className = '',
}: {
  className?: string;
}) {
  return (
    <span
      className={`spinner-border spinner-border-sm ${className}`.trim()}
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
  const spinnerSize = size === 'sm' ? 'spinner-border-sm' : '';
  return (
    <div
      className={`d-flex align-items-center justify-content-center gap-2 text-muted small ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className={`spinner-border ${spinnerSize}`.trim()} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="d-flex justify-content-center align-items-center py-5"
      style={{ minHeight: '40vh' }}
    >
      <Spinner label={label} />
    </div>
  );
}
