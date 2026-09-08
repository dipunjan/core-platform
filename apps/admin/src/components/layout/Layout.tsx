import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useStorefront, siteName, useSiteBranding } from '@/hooks';
import { brandImage } from '@/lib/brandImage';
import { Button } from '@/components/ui';

const item = ({ isActive }: { isActive: boolean }) =>
  `nav-link${isActive ? ' active' : ''}`;

export function Layout() {
  const { user, signOut } = useAuth();
  const { storefront } = useStorefront();
  const { pathname } = useLocation();
  const name = siteName(storefront);
  const logo = brandImage(storefront?.logoUrl, 'logo');

  useSiteBranding(storefront);

  if (pathname === '/login') {
    return <Outlet />;
  }
  return (
    <div className="d-flex min-vh-100">
      <aside
        className="admin-sidebar d-flex flex-column border-end bg-white px-3 py-4"
        style={{ width: '14rem', flexShrink: 0 }}
      >
        <div className="d-flex align-items-center gap-2 px-2">
          <img
            src={logo}
            alt=""
            width={28}
            height={28}
            className="rounded object-fit-contain"
            style={{ width: '1.75rem', height: '1.75rem' }}
          />
          <p className="small fw-bold mb-0">
            {name} admin
          </p>
        </div>
        <nav className="nav flex-column gap-1 mt-4">
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
        <div className="mt-auto px-2 pt-4">
          <p className="mb-2 text-truncate text-muted small">{user?.email}</p>
          <Button
            type="button"
            variant="secondary"
            className="w-100"
            onClick={() => void signOut()}
          >
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-grow-1 p-4" style={{ minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
