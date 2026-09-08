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
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-4',
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
        'card shadow-sm',
        variant === 'interactive' && 'card-hover',
        className,
      )}
      {...props}
    >
      <div className={cn('card-body', paddingClass[padding])}>{children}</div>
    </Tag>
  );
}
