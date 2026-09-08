import { useEffect, useState, type FormEvent } from 'react';
import {
  docId,
  type Address,
  type User,
} from '@/api';
import { AddressFields, emptyAddress } from '@/components/account';
import { Button, Field, Flash, PageHeader, PageLoader, SelectField } from '@/components/ui';
import { confirmAction } from '@/lib/confirm';
import { useAuth } from '@/hooks';
import { userError, useUserMutations, useUsersQuery } from '@/query';

function formatAddress(address?: Address) {
  if (!address?.line1) {
    return 'No address';
  }
  const line2 = address.line2 ? `, ${address.line2}` : '';
  return `${address.line1}${line2}, ${address.city}, ${address.region} ${address.postalCode}, ${address.country}`;
}

export function PeoplePage() {
  const { user: me } = useAuth();
  const peopleQuery = useUsersQuery();
  const { create, update, setRole: setUserRole, remove: removeUser } = useUserMutations();
  const people = peopleQuery.data ?? [];
  const loading = peopleQuery.isLoading;
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
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState(emptyAddress);
  const [editSaving, setEditSaving] = useState(false);
  const [editNameError, setEditNameError] = useState('');

  async function createAccount(event: FormEvent) {
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
      await create.mutateAsync({
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
    } catch (err) {
      setError(userError(err, 'Could not create account'));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(person: User) {
    setEditingId(docId(person));
    setEditName(person.name);
    setEditPhone(person.phone ?? '');
    setEditAddress(person.address ?? emptyAddress());
    setEditNameError('');
  }

  function cancelEdit() {
    setEditingId('');
    setEditName('');
    setEditPhone('');
    setEditAddress(emptyAddress());
    setEditNameError('');
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    const name = editName.trim();
    setEditNameError('');
    if (!name) {
      setEditNameError('Enter a name.');
      setError('Fix the highlighted fields and try again.');
      return;
    }
    if (!editPhone.trim() || editPhone.trim().length < 7) {
      setError('Enter a valid mobile phone number.');
      return;
    }
    if (
      !editAddress.line1.trim() ||
      !editAddress.city.trim() ||
      !editAddress.postalCode.trim()
    ) {
      setError('Fill in the shipping address (street, city, and postal code).');
      return;
    }
    setEditSaving(true);
    try {
      await update.mutateAsync({
        id: editingId,
        body: {
          name,
          phone: editPhone.trim(),
          address: editAddress,
        },
      });
      cancelEdit();
      setNotice('Account updated.');
    } catch (err) {
      setError(userError(err, 'Could not update account'));
    } finally {
      setEditSaving(false);
    }
  }

  async function changeUserRole(person: User, next: 'customer' | 'admin') {
    const label = next === 'admin' ? 'admin' : 'customer';
    if (
      !confirmAction(
        `Make ${person.name} a ${label}?`,
      )
    ) {
      return;
    }
    setError('');
    setNotice('');
    try {
      await setUserRole.mutateAsync({ id: docId(person), role: next });
      setNotice(`${person.name} is now a ${label}.`);
    } catch (err) {
      setError(userError(err, 'Could not change role'));
    }
  }

  async function remove(person: User) {
    if (
      !confirmAction(
        `Delete ${person.name} (${person.email})? This cannot be undone.`,
      )
    ) {
      return;
    }
    setError('');
    setNotice('');
    try {
      await removeUser.mutateAsync(docId(person));
      setNotice('Account removed.');
    } catch (err) {
      setError(userError(err, 'Could not delete account'));
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
      <PageHeader title="People" />
      <Flash tone="success">{notice}</Flash>
      <Flash>{error}</Flash>
      <form
        onSubmit={(event) => void createAccount(event)}
        className="card mb-4"
        style={{ maxWidth: '36rem' }}
      >
        <div className="card-body">
          <h2 className="admin-section-title mb-3">Add account</h2>
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
          <SelectField
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'customer' | 'admin')}
          >
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </SelectField>
          <Button type="submit" loading={saving}>Create</Button>
        </div>
      </form>
      <Group
        title="Admins"
        people={admins}
        myId={myId}
        editingId={editingId}
        editName={editName}
        editPhone={editPhone}
        editAddress={editAddress}
        editNameError={editNameError}
        editSaving={editSaving}
        onEditName={setEditName}
        onEditPhone={setEditPhone}
        onEditAddress={setEditAddress}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        onSaveEdit={saveEdit}
        onRole={changeUserRole}
        onRemove={remove}
      />
      <Group
        title="Customers"
        people={customers}
        myId={myId}
        editingId={editingId}
        editName={editName}
        editPhone={editPhone}
        editAddress={editAddress}
        editNameError={editNameError}
        editSaving={editSaving}
        onEditName={setEditName}
        onEditPhone={setEditPhone}
        onEditAddress={setEditAddress}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        onSaveEdit={saveEdit}
        onRole={changeUserRole}
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
  editName,
  editPhone,
  editAddress,
  editNameError,
  editSaving,
  onEditName,
  onEditPhone,
  onEditAddress,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRole,
  onRemove,
}: {
  title: string;
  people: User[];
  myId: string;
  editingId: string;
  editName: string;
  editPhone: string;
  editAddress: Address;
  editNameError: string;
  editSaving: boolean;
  onEditName: (name: string) => void;
  onEditPhone: (phone: string) => void;
  onEditAddress: (address: Address) => void;
  onStartEdit: (person: User) => void;
  onCancelEdit: () => void;
  onSaveEdit: (event: FormEvent) => void;
  onRole: (person: User, role: 'customer' | 'admin') => void;
  onRemove: (person: User) => void;
}) {
  return (
    <section className="card mb-4 admin-list-card" style={{ maxWidth: '48rem' }}>
      <div className="card-header admin-section-title py-3">{title}</div>
      <ul className="list-group list-group-flush">
        {people.length === 0 ? (
          <li className="list-group-item text-center text-muted py-4">
            No {title.toLowerCase()} yet.
          </li>
        ) : null}
        {people.map((person) => {
          const id = docId(person);
          const mine = id === myId;
          const editing = editingId === id;
          return (
            <li key={id} className="list-group-item">
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div>
                  <strong>{person.name}</strong>
                  <p className="small text-muted mb-0">{person.email}</p>
                  <p className="small text-muted mb-0">
                    {person.phone || 'No phone'} · {formatAddress(person.address)}
                  </p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      editing ? onCancelEdit() : onStartEdit(person)
                    }
                  >
                    {editing ? 'Close' : 'Edit'}
                  </Button>
                  {person.role === 'admin' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={mine}
                      title={mine ? "You can't change your own role here" : undefined}
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
                    title={mine ? "You can't delete your own account" : undefined}
                    onClick={() => onRemove(person)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              {editing ? (
                <form
                  onSubmit={(event) => void onSaveEdit(event)}
                  className="card mt-3 admin-panel-edit"
                >
                  <div className="card-body">
                    <Field
                      label="Name"
                      value={editName}
                      onChange={(e) => onEditName(e.target.value)}
                      error={editNameError}
                      required
                    />
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
                    <div className="d-flex flex-wrap gap-2">
                      <Button type="submit" loading={editSaving}>
                        Save changes
                      </Button>
                      <Button type="button" variant="secondary" onClick={onCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
