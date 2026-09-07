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
    <section className={cn('mt-14', className)}>
      {title ? (
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-zinc-500">{description}</p>
            ) : null}
          </div>
          {action ? (
            <Link
              to={action.to}
              className="text-sm font-semibold text-emerald-800 hover:underline"
            >
              {action.label}
            </Link>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
