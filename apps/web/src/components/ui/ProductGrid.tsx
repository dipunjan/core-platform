import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ProductGridProps = {
  children: ReactNode;
  cols?: 3 | 4;
  className?: string;
};

const colsClass = {
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export function ProductGrid({
  children,
  cols = 3,
  className = '',
}: ProductGridProps) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-4', colsClass[cols], className)}
    >
      {children}
    </div>
  );
}
