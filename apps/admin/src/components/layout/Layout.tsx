import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui';

const item = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-semibold ${
    isActive ? 'bg-zinc-950 text-white' : 'text-zinc-700 hover:bg-zinc-100'
  }`;

export function Layout() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  if (pathname === '/login') {
    return <Outlet />;
  }
  return (
    <div className="flex min-h-screen bg-zinc-100">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-6">
        <p className="px-3 text-lg font-bold tracking-tight text-zinc-950">
          swoop admin
        </p>
        <nav className="mt-6 grid gap-1">
          <NavLink to="/" end className={item}>
            Sales
          </NavLink>
          <NavLink to="/branding" className={item}>
            Branding
          </NavLink>
          <NavLink to="/people" className={item}>
            People
          </NavLink>
          <NavLink to="/products" className={item}>
            Products
          </NavLink>
          <NavLink to="/categories" className={item}>
            Categories
          </NavLink>
          <NavLink to="/inventory" className={item}>
            Inventory
          </NavLink>
        </nav>
        <div className="mt-auto px-3 pt-6">
          <p className="mb-2 truncate text-xs text-zinc-500">{user?.email}</p>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => void signOut()}
          >
            Log out
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
