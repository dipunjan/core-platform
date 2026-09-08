import type { ReactNode } from 'react';
import { Badge } from './Badge';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <header className="mb-4">
      {eyebrow ? <Badge className="letter-spacing-wide">{eyebrow}</Badge> : null}
      <h1 className="h2 fw-semibold mt-1">{title}</h1>
      {description ? (
        <p className="text-muted small mt-2 mb-0">{description}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
