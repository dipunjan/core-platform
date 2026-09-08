import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type PageTitleProps = {
  children: ReactNode;
  subtitle?: string;
  className?: string;
};

export function PageTitle({ children, subtitle, className = '' }: PageTitleProps) {
  return (
    <header className={className}>
      <h1 className="h2 fw-semibold">{children}</h1>
      {subtitle ? (
        <p className="text-muted small mt-2 mb-0">{subtitle}</p>
      ) : null}
    </header>
  );
}
