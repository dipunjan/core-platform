import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  tone?: 'error' | 'success' | 'info';
};

const tones: Record<NonNullable<Props['tone']>, string> = {
  error: 'alert-danger',
  success: 'alert-success',
  info: 'alert-info',
};

export function Flash({ children, tone = 'error' }: Props) {
  if (!children) {
    return null;
  }
  return (
    <div
      className={`alert ${tones[tone]} mb-4`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {children}
    </div>
  );
}
