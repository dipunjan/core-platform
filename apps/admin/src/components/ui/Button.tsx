import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { SpinnerIcon } from './Spinner';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'light' | 'onDark';
  loading?: boolean;
  loadingLabel?: string;
};

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-outline-secondary',
  danger: 'btn-danger',
  light: 'btn-light',
  onDark: 'btn-outline-light',
};

function loadingText(
  children: ReactNode,
  loadingLabel?: string,
): string {
  if (loadingLabel) {
    return loadingLabel;
  }
  if (typeof children === 'string') {
    return children.replace(/\.\.\.$/, '').trim() + '…';
  }
  return 'Saving…';
}

export function Button({
  variant = 'primary',
  className = '',
  loading = false,
  loadingLabel,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      className={`btn btn-sm ${variants[variant]} ${className}`.trim()}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <SpinnerIcon className="me-2" />
          {loadingText(children, loadingLabel)}
        </>
      ) : (
        children
      )}
    </button>
  );
}
