import { useEffect, useState, type FormEvent } from 'react';
import {
  apiMessage,
  docId,
  http,
  urls,
  type Address,
  type User,
} from '@/api';
import { AddressFields, emptyAddress } from '@/components/account';
import { Button, Field, Flash, PageLoader } from '@/components/ui';
import { useAuth } from '@/hooks';

function formatAddress(address?: Address) {
  if (!address?.line1) {
    return 'No address';
  }
  const line2 = address.line2 ? `, ${address.line2}` : '';
  return `${address.line1}${line2}, ${address.city}, ${address.region} ${address.postalCode}, ${address.country}`;
}

export function PeoplePage() {
  const { user: me } = useAuth();
  const [people, setPeople] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('secret12');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(emptyAddress);
  const [role, setRole] = useState<'customer' | 'admin'>('customer');
  const [editingId, setEditingId] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState(emptyAddress);

  async function reload() {
    const { data } = await http.get<User[]>(urls.users);
    setPeople(data);
  }

  useEffect(() => {
    setLoading(true);
    void reload()
      .catch((err) => setError(apiMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError('Name, email, and a password of at least 8 characters are required.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError('Enter a valid mobile phone number.');
      return;
    }
    if (!address.line1.trim() || !address.city.trim() || !address.postalCode.trim()) {
      setError('Fill in the shipping address (street, city, and postal code).');
      return;
    }
    setSaving(true);
    try {
      await http.post(urls.managedUsers, {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim(),
        address,
      });
      setName('');
      setEmail('');
      setPhone('');
      setAddress(emptyAddress());
      setNotice('Account created.');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(person: User) {
    setEditingId(docId(person));
    setEditPhone(person.phone ?? '');
    setEditAddress(person.address ?? emptyAddress());
  }

  async function saveAddress(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await http.patch(urls.user(editingId), {
        phone: editPhone,
        address: editAddress,
      });
      setEditingId('');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function setUserRole(person: User, next: 'customer' | 'admin') {
    setError('');
    try {
      await http.patch(urls.userRole(docId(person)), { role: next });
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function remove(person: User) {
    setError('');
    try {
      await http.delete(urls.user(docId(person)));
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  const myId = me ? docId(me) : '';
  const admins = people.filter((person) => person.role === 'admin');
  const customers = people.filter((person) => person.role !== 'admin');

  if (loading) {
    return <PageLoader label="Loading people…" />;
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">People</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Create shoppers or staff with a shipping address. You cannot delete or
        demote yourself, or remove the last admin.
      </p>
      <Flash tone="success">{notice}</Flash>
      <Flash>{error}</Flash>
      <form
        onSubmit={(event) => void create(event)}
        className="mb-10 max-w-xl rounded-xl border border-zinc-200 bg-white p-6"
      >
        <h2 className="mb-4 font-semibold">Add account</h2>
        <Field
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Password (min 8)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <Field
          label="Mobile phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          minLength={7}
          required
        />
        <AddressFields value={address} onChange={setAddress} />
        <label className="mb-4 grid gap-1.5 text-sm font-medium text-zinc-700">
          Role
          <select
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value as 'customer' | 'admin')}
          >
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <Button type="submit" loading={saving}>Create</Button>
      </form>
      <Group
        title="Admins"
        people={admins}
        myId={myId}
        editingId={editingId}
        editPhone={editPhone}
        editAddress={editAddress}
        onEditPhone={setEditPhone}
        onEditAddress={setEditAddress}
        onStartEdit={startEdit}
        onCancelEdit={() => setEditingId('')}
        onSaveAddress={saveAddress}
        onRole={setUserRole}
        onRemove={remove}
      />
      <Group
        title="Customers"
        people={customers}
        myId={myId}
        editingId={editingId}
        editPhone={editPhone}
        editAddress={editAddress}
        onEditPhone={setEditPhone}
        onEditAddress={setEditAddress}
        onStartEdit={startEdit}
        onCancelEdit={() => setEditingId('')}
        onSaveAddress={saveAddress}
        onRole={setUserRole}
        onRemove={remove}
      />
    </>
  );
}

function Group({
  title,
  people,
  myId,
  editingId,
  editPhone,
  editAddress,
  onEditPhone,
  onEditAddress,
  onStartEdit,
  onCancelEdit,
  onSaveAddress,
  onRole,
  onRemove,
}: {
  title: string;
  people: User[];
  myId: string;
  editingId: string;
  editPhone: string;
  editAddress: Address;
  onEditPhone: (phone: string) => void;
  onEditAddress: (address: Address) => void;
  onStartEdit: (person: User) => void;
  onCancelEdit: () => void;
  onSaveAddress: (event: FormEvent) => void;
  onRole: (person: User, role: 'customer' | 'admin') => void;
  onRemove: (person: User) => void;
}) {
  return (
    <section className="mb-8 max-w-3xl rounded-xl border border-zinc-200 bg-white">
      <h2 className="border-b border-zinc-100 px-4 py-3 font-semibold">{title}</h2>
      <ul>
        {people.map((person) => {
          const id = docId(person);
          const mine = id === myId;
          const editing = editingId === id;
          return (
            <li
              key={id}
              className="border-b border-zinc-100 px-4 py-3 last:border-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <strong>{person.name}</strong>
                  <p className="text-sm text-zinc-500">{person.email}</p>
                  <p className="text-sm text-zinc-500">
                    {person.phone || 'No phone'} · {formatAddress(person.address)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      editing ? onCancelEdit() : onStartEdit(person)
                    }
                  >
                    {editing ? 'Close' : 'Address'}
                  </Button>
                  {person.role === 'admin' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={mine}
                      onClick={() => onRole(person, 'customer')}
                    >
                      Make customer
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onRole(person, 'admin')}
                    >
                      Make admin
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="danger"
                    disabled={mine}
                    onClick={() => onRemove(person)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              {editing ? (
                <form
                  onSubmit={(event) => void onSaveAddress(event)}
                  className="mt-4 max-w-xl"
                >
                  <Field
                    label="Mobile phone"
                    type="tel"
                    value={editPhone}
                    onChange={(e) => onEditPhone(e.target.value)}
                    minLength={7}
                    required
                  />
                  <AddressFields
                    value={editAddress}
                    onChange={onEditAddress}
                  />
                  <Button type="submit">Save address</Button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
