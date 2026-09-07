import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  tone?: 'error' | 'success' | 'info';
};

const tones: Record<NonNullable<Props['tone']>, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
};

export function Flash({ children, tone = 'error' }: Props) {
  if (!children) {
    return null;
  }
  return (
    <div
      className={`mb-4 rounded-lg border px-3 py-2.5 text-sm ${tones[tone]}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {children}
    </div>
  );
}
