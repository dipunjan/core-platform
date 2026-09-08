import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useCart, useCatalog, siteName, useSiteBranding } from '@/hooks';
import { brandImage } from '@/lib/brandImage';
import { cn } from '@/lib/cn';
import { Button, SpinnerIcon } from '@/components/ui';
import { SearchBar } from './SearchBar';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn('shop-nav-link', isActive && 'active');

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
    <div className="d-flex flex-column min-vh-100">
      <header
        className="sticky-top bg-white border-bottom shadow-sm"
        style={{ zIndex: 1020 }}
      >
        <nav className="navbar navbar-expand-lg py-2">
          <div className="container">
            <Link className="navbar-brand d-flex align-items-center gap-2 me-4" to="/">
              <img
                src={logo}
                alt=""
                width={36}
                height={36}
                className="rounded object-fit-contain"
                style={{ width: 36, height: 36 }}
              />
              <span className="fs-5 fw-bold">{name}</span>
            </Link>
            <div className="navbar-nav flex-row gap-1">
              <NavLink to="/" className={navLinkClass} end>
                Home
              </NavLink>
              <NavLink to="/shop" className={navLinkClass({ isActive: shopOn })}>
                Shop
              </NavLink>
              <NavLink to="/cart" className={navLinkClass}>
                Cart{cartCount ? ` (${cartCount})` : ''}
              </NavLink>
              {user ? (
                <NavLink to="/orders" className={navLinkClass}>
                  Orders
                </NavLink>
              ) : null}
            </div>
            <div className="ms-auto d-flex align-items-center gap-2">
              {loading ? (
                <SpinnerIcon className="text-muted" />
              ) : user ? (
                <>
                  <span className="d-none d-sm-inline small fw-medium">
                    {user.name}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void signOut()}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="btn btn-link text-decoration-none fw-semibold text-body"
                  >
                    Log in
                  </NavLink>
                  <NavLink to="/register" className="btn btn-dark btn-sm fw-semibold">
                    Register
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </nav>
        <div className="border-top bg-light py-2">
          <div className="container">
            <SearchBar />
          </div>
        </div>
      </header>
      <main className="container flex-grow-1 py-4">
        <Outlet />
      </main>
      <footer className="border-top bg-white py-3 text-center text-muted small">
        {name}
      </footer>
    </div>
  );
}
