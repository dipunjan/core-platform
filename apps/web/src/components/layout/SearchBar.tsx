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
    <div className={cn('relative w-full', className)}>
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search products"
        autoComplete="off"
        spellCheck={false}
        aria-label="Search products"
        aria-busy={pending}
        className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-4 pr-10 text-sm text-zinc-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
      />
      {pending ? (
        <SpinnerIcon
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        />
      ) : null}
      {draft.trim().length > 0 && draft.trim().length < SEARCH_MIN_CHARS ? (
        <p className="mt-1 text-xs text-zinc-500">
          Type at least {SEARCH_MIN_CHARS} characters to search.
        </p>
      ) : null}
    </div>
  );
}
