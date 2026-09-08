import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '@/lib/search';

type Props = {
  className?: string;
};

export function SearchBar({ className = '' }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const urlQ = params.get('q') ?? '';
  const [draft, setDraft] = useState(urlQ);

  useEffect(() => {
    setDraft(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const term = draft.trim();
    const current = urlQ.trim();

    if (term === current) {
      return;
    }

    // Avoid URL churn for a lone character when search is not active yet.
    if (term.length > 0 && term.length < SEARCH_MIN_CHARS && !current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(window.location.search);
      if (term.length >= SEARCH_MIN_CHARS) {
        next.set('q', term);
      } else {
        next.delete('q');
      }
      const qs = next.toString();

      if (!pathname.startsWith('/shop')) {
        navigate(qs ? `/shop?${qs}` : '/shop');
        return;
      }

      const base =
        pathname.startsWith('/shop/') && pathname !== '/shop'
          ? pathname
          : '/shop';
      navigate(qs ? `${base}?${qs}` : base, { replace: true });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [draft, urlQ, pathname, navigate]);

  return (
    <div className={cn('search-bar w-100', className)}>
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search products"
        autoComplete="off"
        spellCheck={false}
        aria-label="Search products"
        aria-describedby="shop-search-hint"
        className="form-control"
      />
      <p id="shop-search-hint" className="search-bar-hint mb-0">
        {draft.trim().length > 0 && draft.trim().length < SEARCH_MIN_CHARS
          ? `Type at least ${SEARCH_MIN_CHARS} characters to search.`
          : '\u00a0'}
      </p>
    </div>
  );
}
