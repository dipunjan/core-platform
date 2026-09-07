import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeProps = {
  children: ReactNode;
  tone?: 'brand' | 'muted';
  className?: string;
};

const toneClass = {
  brand: 'text-emerald-800',
  muted: 'text-zinc-400',
};

export function Badge({ children, tone = 'brand', className = '' }: BadgeProps) {
  return (
    <span
      className={cn(
        'text-xs font-semibold uppercase tracking-wide',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
