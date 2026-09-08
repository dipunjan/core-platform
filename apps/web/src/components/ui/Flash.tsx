import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  children: ReactNode;
  tone?: 'error' | 'success' | 'info';
};

const tones: Record<NonNullable<Props['tone']>, string> = {
  error: 'alert alert-danger',
  success: 'alert alert-success',
  info: 'alert alert-info',
};

export function Flash({ children, tone = 'error' }: Props) {
  if (!children) {
    return null;
  }
  return (
    <div
      className={cn('alert mb-3', tones[tone])}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {children}
    </div>
  );
}
