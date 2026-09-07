import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useCart, useCatalog, siteName, useSiteBranding } from '@/hooks';
import { brandImage } from '@/lib/brandImage';
import { Button, SpinnerIcon } from '@/components/ui';
import { SearchBar } from './SearchBar';

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
  const { storefront } = useCatalog();
  const { pathname } = useLocation();
  const shopOn = pathname === '/shop' || pathname.startsWith('/shop/');
  const cartCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const logo = brandImage(storefront?.logoUrl, 'logo');
  const name = siteName(storefront);

  useSiteBranding(storefront);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white shadow-sm">
        <nav className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4 sm:h-16 sm:px-6">
          <Link className="mr-4 flex items-center gap-2 sm:mr-8" to="/">
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
            <NavLink to="/shop" className={linkClass({ isActive: shopOn })}>
              Shop
            </NavLink>
            <NavLink to="/cart" className={linkClass}>
              Cart{cartCount ? ` (${cartCount})` : ''}
            </NavLink>
            {user ? (
              <NavLink to="/orders" className={linkClass}>
                Orders
              </NavLink>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {loading ? (
              <SpinnerIcon className="h-4 w-4 text-zinc-400" />
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
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <SearchBar />
          </div>
        </div>
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
