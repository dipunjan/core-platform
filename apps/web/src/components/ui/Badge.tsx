import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeProps = {
  children: ReactNode;
  tone?: 'brand' | 'muted';
  className?: string;
};

const toneClass = {
  brand: 'text-primary',
  muted: 'text-muted',
};

export function Badge({ children, tone = 'brand', className = '' }: BadgeProps) {
  return (
    <span
      className={cn(
        'small fw-semibold text-uppercase',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
