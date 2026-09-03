import type { ButtonHTMLAttributes } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  const extra = variant === 'primary' ? '' : ` ${variant}`;
  return <button className={`btn${extra} ${className}`.trim()} {...props} />;
}
