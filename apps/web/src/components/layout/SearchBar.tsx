import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { FormEvent } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  className?: string;
};

export function SearchBar({ className = '' }: Props) {
  const navigate = useNavigate();
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
    const qs = next.toString();
    navigate(qs ? `/shop?${qs}` : '/shop');
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn('flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs', className)}
    >
      <input
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search products…"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
        aria-label="Search products"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Search
      </button>
    </form>
  );
}
