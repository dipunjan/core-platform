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
    <header className="mb-4 pb-3 border-bottom">
      {eyebrow ? (
        <Badge className="letter-spacing-wide mb-2">{eyebrow}</Badge>
      ) : null}
      <h1 className="section-title mt-1">{title}</h1>
      {description ? (
        <p className="text-muted mt-2 mb-0">{description}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
