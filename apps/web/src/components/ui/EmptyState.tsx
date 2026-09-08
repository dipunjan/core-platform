import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function EmptyState({ children }: Props) {
  return (
    <div className="border border-dashed rounded-3 bg-white px-3 py-5 text-center text-muted small">
      {children}
    </div>
  );
}
