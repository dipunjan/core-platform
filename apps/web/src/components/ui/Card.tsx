import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CardOwnProps = {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'interactive';
};

type CardProps<T extends ElementType = 'div'> = CardOwnProps & {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps | 'as' | 'children' | 'className'>;

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-6 sm:p-8',
};

const variantClass = {
  default: '',
  interactive:
    'transition hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-md',
};

export function Card<T extends ElementType = 'div'>({
  as,
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  ...props
}: CardProps<T>) {
  const Tag = as ?? 'div';
  return (
    <Tag
      className={cn(
        'rounded-xl border border-zinc-200 bg-white shadow-sm',
        paddingClass[padding],
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
