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
        'fw-medium',
        muted ? 'text-muted' : 'link-primary',
        className,
      )}
      {...props}
    />
  );
}
