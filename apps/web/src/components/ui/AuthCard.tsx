import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card } from './Card';

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  wide?: boolean;
};

export function AuthCard({
  title,
  description,
  children,
  footer,
  className = '',
  wide = false,
}: AuthCardProps) {
  return (
    <Card
      padding="lg"
      className={cn('mx-auto w-100', className)}
      style={{ maxWidth: wide ? '32rem' : '28rem' }}
    >
      <h1 className="h3 fw-semibold">{title}</h1>
      {description ? (
        <p className="text-muted small mt-2 mb-4">{description}</p>
      ) : null}
      {children}
      {footer ? <div className="mt-4 text-muted small">{footer}</div> : null}
    </Card>
  );
}
