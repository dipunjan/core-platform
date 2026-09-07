import type { ReactNode } from 'react';

type PageTitleProps = {
  children: ReactNode;
  subtitle?: string;
  className?: string;
};

export function PageTitle({ children, subtitle, className = '' }: PageTitleProps) {
  return (
    <header className={className}>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        {children}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
      ) : null}
    </header>
  );
}
