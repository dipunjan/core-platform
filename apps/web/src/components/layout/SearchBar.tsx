import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '@/lib/search';
import { SpinnerIcon } from '@/components/ui/Spinner';

type Props = {
  className?: string;
};

export function SearchBar({ className = '' }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const urlQ = params.get('q') ?? '';
  const [draft, setDraft] = useState(urlQ);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setDraft(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const term = draft.trim();
    const current = urlQ.trim();

    if (term === current) {
      setPending(false);
      return;
    }

    setPending(true);
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (term.length >= SEARCH_MIN_CHARS) {
        next.set('q', term);
      } else {
        next.delete('q');
      }
      const qs = next.toString();

      if (!pathname.startsWith('/shop')) {
        navigate(qs ? `/shop?${qs}` : '/shop');
        setPending(false);
        return;
      }

      const base =
        pathname.startsWith('/shop/') && pathname !== '/shop'
          ? pathname
          : '/shop';
      navigate(qs ? `${base}?${qs}` : base, { replace: true });
      setPending(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [draft, urlQ, params, pathname, navigate]);

  return (
    <div className={cn('position-relative w-100', className)}>
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search products"
        autoComplete="off"
        spellCheck={false}
        aria-label="Search products"
        aria-busy={pending}
        className="form-control pe-5"
      />
      {pending ? (
        <SpinnerIcon
          className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted"
        />
      ) : null}
      {draft.trim().length > 0 && draft.trim().length < SEARCH_MIN_CHARS ? (
        <p className="form-text mb-0 mt-1">
          Type at least {SEARCH_MIN_CHARS} characters to search.
        </p>
      ) : null}
    </div>
  );
}
