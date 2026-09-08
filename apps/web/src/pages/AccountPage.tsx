import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { docId, type Product } from '@/api';
import {
  AddressFields,
  emptyDelivery,
  OrderCard,
} from '@/components';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Flash,
  PageHeader,
  PageLoader,
  TextLink,
} from '@/components/ui';
import { updateMe } from '@/features/auth';
import { useAuth, useCatalog, useOrders } from '@/hooks';
import { useAppDispatch } from '@/store/hooks';

const TABS = [
  { id: 'orders', label: 'Orders' },
  { id: 'profile', label: 'Profile' },
  { id: 'address', label: 'Address' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function parseTab(raw: string | null): TabId {
  if (raw === 'profile' || raw === 'address') {
    return raw;
  }
  return 'orders';
}

export function AccountPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));
  const { user } = useAuth();
  const { orders, error: ordersError, loading: ordersLoading, cancel } =
    useOrders({ load: tab === 'orders' });
  const { products, loadCatalog } = useCatalog();
  const [orderSuccess, setOrderSuccess] = useState('');
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [delivery, setDelivery] = useState(emptyDelivery);
  const [profileBusy, setProfileBusy] = useState(false);
  const [addressBusy, setAddressBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (tab === 'orders') {
      loadCatalog();
    }
  }, [loadCatalog, tab]);

  useEffect(() => {
    const state = location.state as { orderPlaced?: boolean } | null;
    if (state?.orderPlaced) {
      setOrderSuccess('Order placed. We will ship to the address you entered.');
      navigate(
        { pathname: location.pathname, search: '?tab=orders' },
        { replace: true, state: null },
      );
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }
    setProfileName(user.name);
    setDelivery({
      phone: user.phone ?? '',
      address: {
        line1: user.address?.line1 ?? '',
        line2: user.address?.line2 ?? '',
        city: user.address?.city ?? '',
        region: user.address?.region ?? '',
        postalCode: user.address?.postalCode ?? '',
        country: user.address?.country ?? 'US',
      },
    });
  }, [user]);

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) {
      map.set(docId(product), product);
    }
    return map;
  }, [products]);

  function setTab(next: TabId) {
    setSearchParams(next === 'orders' ? {} : { tab: next });
    setSaveMessage('');
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setProfileBusy(true);
    setSaveMessage('');
    const result = await dispatch(updateMe({ name: profileName.trim() }));
    setProfileBusy(false);
    if (updateMe.fulfilled.match(result)) {
      setSaveMessage('Profile updated.');
    }
  }

  async function saveAddress(event: FormEvent) {
    event.preventDefault();
    setAddressBusy(true);
    setSaveMessage('');
    const result = await dispatch(
      updateMe({ phone: delivery.phone, address: delivery.address }),
    );
    setAddressBusy(false);
    if (updateMe.fulfilled.match(result)) {
      setSaveMessage('Address saved.');
    }
  }

  return (
    <>
      <PageHeader eyebrow="Account" title={user?.name ?? 'Your account'} />

      <div className="account-hub">
        <nav className="account-hub-tabs d-flex flex-wrap gap-2 mb-4" aria-label="Account">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`account-hub-tab${tab === item.id ? ' active' : ''}`}
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'orders' ? (
          <>
            <Flash tone="success">{orderSuccess}</Flash>
            <Flash>{ordersError}</Flash>
            {ordersLoading && orders.length === 0 ? (
              <PageLoader label="Loading your orders…" />
            ) : ordersError ? null : orders.length === 0 ? (
              <EmptyState>
                No orders yet. <TextLink to="/cart">Go to cart</TextLink>
              </EmptyState>
            ) : (
              orders.map((order) => (
                <OrderCard
                  key={docId(order)}
                  order={order}
                  productsById={productsById}
                  busy={ordersLoading}
                  onCancel={(id) => void cancel(id)}
                />
              ))
            )}
          </>
        ) : null}

        {tab === 'profile' ? (
          <Card className="account-hub-panel">
            <form onSubmit={(event) => void saveProfile(event)}>
              <Field
                label="Name"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                required
              />
              <Field label="Email" type="email" value={user?.email ?? ''} disabled />
              <Flash tone="success">{saveMessage}</Flash>
              <Button type="submit" disabled={profileBusy}>
                {profileBusy ? 'Saving…' : 'Save profile'}
              </Button>
            </form>
          </Card>
        ) : null}

        {tab === 'address' ? (
          <Card className="account-hub-panel">
            <form onSubmit={(event) => void saveAddress(event)}>
              <AddressFields value={delivery} onChange={setDelivery} />
              <Flash tone="success">{saveMessage}</Flash>
              <Button type="submit" disabled={addressBusy}>
                {addressBusy ? 'Saving…' : 'Save address'}
              </Button>
            </form>
          </Card>
        ) : null}
      </div>
    </>
  );
}
