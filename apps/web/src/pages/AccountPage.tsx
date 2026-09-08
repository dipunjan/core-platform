import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { docId, type Product } from '@/api';
import {
  AddressFields,
  OrderCard,
  Button,
  Card,
  EmptyState,
  Field,
  Flash,
  PageHeader,
  PageLoader,
  TextLink,
} from '@/components';
import { useUpdateMeMutation } from '@/query';
import { useAuth, useCatalog, useOrders } from '@/hooks';
import {
  deliverySchema,
  emptyDeliveryValues,
  profileSchema,
  type DeliveryFormValues,
  type ProfileFormValues,
} from '@/lib/schemas';

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
  const updateMe = useUpdateMeMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));
  const { user } = useAuth();
  const { orders, error: ordersError, loading: ordersLoading, cancel } =
    useOrders({ load: tab === 'orders' });
  const { products } = useCatalog({ load: tab === 'orders' });
  const [orderSuccess, setOrderSuccess] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const addressForm = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: emptyDeliveryValues,
  });

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
    profileForm.reset({ name: user.name });
    addressForm.reset({
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
  }, [addressForm, profileForm, user]);

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

  async function saveProfile(values: ProfileFormValues) {
    setSaveMessage('');
    try {
      await updateMe.mutateAsync({ name: values.name.trim() });
      setSaveMessage('Profile updated.');
    } catch {
      /* field errors shown by mutation if needed */
    }
  }

  async function saveAddress(values: DeliveryFormValues) {
    setSaveMessage('');
    try {
      await updateMe.mutateAsync({
        phone: values.phone,
        address: values.address,
      });
      setSaveMessage('Address saved.');
    } catch {
      /* shown via mutation error if needed */
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
            <form onSubmit={(event) => void profileForm.handleSubmit(saveProfile)(event)}>
              <Field
                label="Name"
                required
                {...profileForm.register('name')}
                error={profileForm.formState.errors.name?.message}
              />
              <Field label="Email" type="email" value={user?.email ?? ''} disabled />
              <Flash tone="success">{saveMessage}</Flash>
              <Button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
              >
                {profileForm.formState.isSubmitting ? 'Saving…' : 'Save profile'}
              </Button>
            </form>
          </Card>
        ) : null}

        {tab === 'address' ? (
          <Card className="account-hub-panel">
            <form onSubmit={(event) => void addressForm.handleSubmit(saveAddress)(event)}>
              <AddressFields
                register={addressForm.register}
                errors={addressForm.formState.errors}
              />
              <Flash tone="success">{saveMessage}</Flash>
              <Button
                type="submit"
                disabled={addressForm.formState.isSubmitting}
              >
                {addressForm.formState.isSubmitting ? 'Saving…' : 'Save address'}
              </Button>
            </form>
          </Card>
        ) : null}
      </div>
    </>
  );
}
