import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/cn';

type TextLinkProps = LinkProps & {
  muted?: boolean;
};

export function TextLink({
  className = '',
  muted = false,
  ...props
}: TextLinkProps) {
  return (
    <Link
      className={cn(
        'font-medium hover:underline',
        muted ? 'text-zinc-600' : 'text-emerald-800',
        className,
      )}
      {...props}
    />
  );
}
