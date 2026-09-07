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
      className={cn(
        'mx-auto w-full',
        wide ? 'max-w-lg' : 'max-w-md',
        className,
      )}
    >
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 mb-6 text-sm text-zinc-500">{description}</p>
      ) : null}
      {children}
      {footer ? <div className="mt-6 text-sm text-zinc-600">{footer}</div> : null}
    </Card>
  );
}
