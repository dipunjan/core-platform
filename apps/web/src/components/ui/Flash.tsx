import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function Flash({ children }: Props) {
  if (!children) {
    return null;
  }
  return (
    <div className="flash" role="alert">
      {children}
    </div>
  );
}
