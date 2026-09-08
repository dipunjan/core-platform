import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ProductGridProps = {
  children: ReactNode;
  cols?: 3 | 4;
  className?: string;
};

const colsClass = {
  3: 'row-cols-sm-2 row-cols-lg-3',
  4: 'row-cols-sm-2 row-cols-lg-4',
};

export function ProductGrid({
  children,
  cols = 3,
  className = '',
}: ProductGridProps) {
  return (
    <div className={cn('row row-cols-1 g-3', colsClass[cols], className)}>
      {children}
    </div>
  );
}
