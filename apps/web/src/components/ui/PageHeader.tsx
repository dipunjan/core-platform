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
    <header className="mb-8">
      {eyebrow ? (
        <Badge className="tracking-[0.18em]">{eyebrow}</Badge>
      ) : null}
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm text-zinc-500">{description}</p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}
