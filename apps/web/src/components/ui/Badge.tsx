import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeProps = {
  children: ReactNode;
  tone?: 'brand' | 'muted';
  className?: string;
};

export function Badge({ children, tone = 'brand', className = '' }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge-pill',
        tone === 'muted' && 'badge-pill-muted',
        className,
      )}
    >
      {children}
    </span>
  );
}
