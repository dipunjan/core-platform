import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
};

export function PageHeader({
  title,
  description,
  eyebrow = 'Staff console',
  children,
}: PageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <p className="admin-page-eyebrow mb-1">{eyebrow}</p>
          <h1 className="admin-page-title">{title}</h1>
          {description ? (
            <p className="admin-page-lead mt-2 mb-0">{description}</p>
          ) : null}
        </div>
        {children ? <div>{children}</div> : null}
      </div>
    </header>
  );
}
