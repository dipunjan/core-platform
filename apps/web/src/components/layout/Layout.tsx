import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui';

export function Layout() {
  const { user, loading, signOut } = useAuth();

  return (
    <div className="shell">
      <nav className="nav">
        <Link className="brand" to="/">
          Core Shop
        </Link>
        <NavLink to="/">Products</NavLink>
        <NavLink to="/cart">Cart</NavLink>
        <NavLink to="/orders">Orders</NavLink>
        {loading ? (
          <span className="muted">…</span>
        ) : user ? (
          <>
            <span>{user.name}</span>
            <Button type="button" onClick={() => void signOut()}>
              Log out
            </Button>
          </>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
