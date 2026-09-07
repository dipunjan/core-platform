import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth, useCart, useCatalog, siteName, useSiteBranding } from '@/hooks';
import { Button } from '@/components/ui';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative px-3 py-2 text-[15px] font-semibold tracking-tight transition-colors',
    isActive
      ? 'text-zinc-950 after:absolute after:right-3 after:bottom-0 after:left-3 after:h-[3px] after:rounded-full after:bg-emerald-600'
      : 'text-zinc-700 hover:text-zinc-950',
  ].join(' ');

export function Layout() {
  const { user, loading, signOut } = useAuth();
  const { cart } = useCart();
  const { storefront, loadStorefront } = useCatalog();
  const { pathname } = useLocation();
  const shopOn = pathname === '/shop' || pathname.startsWith('/shop/');
  const cartCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const logo = storefront?.logoUrl || '/swoop-logo.png';
  const name = siteName(storefront);

  useSiteBranding(storefront);

  useEffect(() => {
    loadStorefront();
  }, [loadStorefront]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 shadow-sm backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-1 px-4 sm:px-6">
          <Link
            className="mr-4 flex items-center gap-2 sm:mr-8"
            to="/"
          >
            <img
              src={logo}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="text-lg font-bold tracking-tight text-zinc-950">
              {name}
            </span>
          </Link>
          <div className="flex items-center gap-0.5">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            <NavLink
              to="/shop"
              className={linkClass({ isActive: shopOn })}
            >
              Shop
            </NavLink>
            <NavLink to="/cart" className={linkClass}>
              Cart{cartCount ? ` (${cartCount})` : ''}
            </NavLink>
            <NavLink to="/orders" className={linkClass}>
              Orders
            </NavLink>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {loading ? (
              <span className="text-sm text-zinc-500">…</span>
            ) : user ? (
              <>
                <span className="hidden text-sm font-medium text-zinc-800 sm:inline">
                  {user.name}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-zinc-300 font-semibold text-zinc-900"
                  onClick={() => void signOut()}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="rounded-lg px-3 py-2 text-[15px] font-semibold text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950"
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-lg bg-zinc-950 px-3.5 py-2 text-[15px] font-semibold text-white hover:bg-zinc-800"
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-sm text-zinc-500">
        {name}
      </footer>
    </div>
  );
}
