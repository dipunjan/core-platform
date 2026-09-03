import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function Flash({ children }: Props) {
  if (!children) {
    return null;
  }
  return (
    <div
      className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
      role="alert"
    >
      {children}
    </div>
  );
}
