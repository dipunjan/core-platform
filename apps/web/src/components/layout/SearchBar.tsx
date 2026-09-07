import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { FormEvent } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  className?: string;
};

export function SearchBar({ className = '' }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState(() => params.get('q') ?? '');

  useEffect(() => {
    setQ(params.get('q') ?? '');
  }, [params]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const term = q.trim();
    const next = new URLSearchParams(params);
    if (term) {
      next.set('q', term);
    } else {
      next.delete('q');
    }
    const shopPath = pathname.startsWith('/shop') ? pathname : '/shop';
    const qs = next.toString();
    navigate(qs ? `${shopPath}?${qs}` : shopPath);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn('flex w-full items-stretch gap-0', className)}
    >
      <input
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search products"
        className="min-w-0 flex-1 rounded-l-lg border border-zinc-300 border-r-0 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
        aria-label="Search products"
      />
      <button
        type="submit"
        className="shrink-0 rounded-r-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        Search
      </button>
    </form>
  );
}
