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
      <header className="site-header sticky-top" style={{ zIndex: 1020 }}>
        <nav className="navbar navbar-expand-lg py-2">
          <div className="container">
            <Link className="navbar-brand d-flex align-items-center gap-2 me-lg-4" to="/">
              <img
                src={logo}
                alt=""
                width={40}
                height={40}
                className="rounded-3 object-fit-contain"
                style={{ width: 40, height: 40 }}
              />
              <span className="fs-5 fw-bold">{name}</span>
            </Link>
            <div className="navbar-nav flex-row gap-1 ms-lg-2">
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
                  <span className="d-none d-sm-inline small fw-medium text-muted">
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
                  <NavLink to="/register" className="btn btn-dark btn-sm fw-semibold px-3">
                    Register
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </nav>
        <div className="border-top py-3" style={{ borderColor: 'rgb(24 24 27 / 0.06)' }}>
          <div className="container">
            <SearchBar className="search-bar" />
          </div>
        </div>
      </header>
      <main className="container flex-grow-1 py-4 py-lg-5">
        <Outlet />
      </main>
      <footer className="site-footer py-5">
        <div className="container">
          <div className="row g-4 align-items-start">
            <div className="col-md-6">
              <div className="d-flex align-items-center gap-2 mb-2">
                <img
                  src={logo}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-2 object-fit-contain"
                />
                <span className="fw-bold text-white">{name}</span>
              </div>
              <p className="small mb-0 opacity-75">
                Curated drops, simple checkout, no fuss.
              </p>
            </div>
            <div className="col-md-3">
              <p className="small fw-semibold text-white mb-2">Shop</p>
              <div className="d-flex flex-column gap-1 small">
                <Link to="/shop">All products</Link>
                <Link to="/cart">Your cart</Link>
                {user ? <Link to="/orders">Orders</Link> : null}
              </div>
            </div>
            <div className="col-md-3">
              <p className="small fw-semibold text-white mb-2">Account</p>
              <div className="d-flex flex-column gap-1 small">
                {user ? (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-start small"
                    onClick={() => void signOut()}
                  >
                    Log out
                  </button>
                ) : (
                  <>
                    <Link to="/login">Log in</Link>
                    <Link to="/register">Create account</Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <hr className="border-secondary opacity-25 my-4" />
          <p className="small text-center mb-0 opacity-50">
            © {new Date().getFullYear()} {name}
          </p>
        </div>
      </footer>
    </div>
  );
}
