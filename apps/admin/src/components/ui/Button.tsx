import type { ButtonHTMLAttributes } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'light' | 'onDark';
};

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'border border-transparent bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:outline-emerald-700',
  secondary:
    'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 focus-visible:outline-zinc-400',
  danger:
    'border border-transparent bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700',
  light:
    'border border-transparent bg-white text-zinc-950 hover:bg-zinc-200 focus-visible:outline-white',
  onDark:
    'border border-white/35 bg-transparent text-white hover:bg-white/10 focus-visible:outline-white',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 ${variants[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
