import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useStorefront, siteName, useSiteBranding } from '@/hooks';
import { brandImage } from '@/lib/brandImage';
import { Button } from '@/components/ui';

const NAV = [
  { to: '/', end: true, label: 'Sales', icon: '◆' },
  { to: '/branding', label: 'Branding', icon: '◇' },
  { to: '/people', label: 'People', icon: '◎' },
  { to: '/products', label: 'Products', icon: '▣' },
  { to: '/categories', label: 'Categories', icon: '▤' },
  { to: '/inventory', label: 'Inventory', icon: '▥' },
] as const;

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
    <div className="admin-shell d-flex">
      <aside className="admin-sidebar d-flex flex-column px-3 py-4">
        <div className="admin-sidebar-brand px-2">
          <div className="d-flex align-items-center gap-2">
            <img
              src={logo}
              alt=""
              width={36}
              height={36}
              className="rounded-3 object-fit-contain"
              style={{ width: 36, height: 36 }}
            />
            <div>
              <span className="d-block fw-bold text-white">{name}</span>
              <span className="admin-sidebar-badge">Admin</span>
            </div>
          </div>
        </div>

        <p className="nav-label mb-0">Manage</p>
        <nav className="nav flex-column gap-1">
          {NAV.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end ?? false}
              className={item}
            >
              <span className="nav-icon" aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-1 pt-4">
          <div className="admin-user-card mb-3">
            <p className="small fw-semibold text-white mb-1 text-truncate">
              {user?.name ?? 'Staff'}
            </p>
            <p className="user-email mb-0 text-truncate">{user?.email}</p>
          </div>
          <Button
            type="button"
            variant="onDark"
            className="w-100"
            onClick={() => void signOut()}
          >
            Log out
          </Button>
        </div>
      </aside>
      <main className="admin-main flex-grow-1 p-4 p-lg-5">
        <Outlet />
      </main>
    </div>
  );
}
