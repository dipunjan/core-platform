import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function EmptyState({ children }: Props) {
  return (
    <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
      {children}
    </p>
  );
}
