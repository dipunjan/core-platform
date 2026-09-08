import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

type SectionProps = {
  title?: string;
  description?: string;
  action?: { to: string; label: string };
  children: ReactNode;
  className?: string;
};

export function Section({
  title,
  description,
  action,
  children,
  className = '',
}: SectionProps) {
  return (
    <section className={cn('section-block', className)}>
      {title ? (
        <div className="d-flex align-items-end justify-content-between gap-3 mb-4">
          <div>
            <p className="section-eyebrow mb-1">Collection</p>
            <h2 className="section-title mb-0">{title}</h2>
            {description ? (
              <p className="text-muted mt-2 mb-0">{description}</p>
            ) : null}
          </div>
          {action ? (
            <Link
              to={action.to}
              className="link-primary fw-semibold small text-nowrap"
            >
              {action.label} →
            </Link>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
