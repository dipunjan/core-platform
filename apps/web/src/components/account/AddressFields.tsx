import { Field } from '@/components/ui';
import type { Address } from '@/api';

export type DeliveryForm = {
  phone: string;
  address: Address;
};

type Props = {
  value: DeliveryForm;
  onChange: (next: DeliveryForm) => void;
};

export function AddressFields({ value, onChange }: Props) {
  const { phone, address } = value;
  function setAddress(patch: Partial<Address>) {
    onChange({ phone, address: { ...address, ...patch } });
  }

  return (
    <>
      <Field
        label="Mobile phone"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => onChange({ phone: e.target.value, address })}
        required
      />
      <Field
        label="Address"
        autoComplete="address-line1"
        value={address.line1}
        onChange={(e) => setAddress({ line1: e.target.value })}
        required
      />
      <Field
        label="Apt, suite (optional)"
        autoComplete="address-line2"
        value={address.line2 ?? ''}
        onChange={(e) => setAddress({ line2: e.target.value })}
      />
      <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
        <Field
          label="City"
          autoComplete="address-level2"
          value={address.city}
          onChange={(e) => setAddress({ city: e.target.value })}
          required
        />
        <Field
          label="State / region"
          autoComplete="address-level1"
          value={address.region}
          onChange={(e) => setAddress({ region: e.target.value })}
          required
        />
      </div>
      <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
        <Field
          label="ZIP / postal code"
          autoComplete="postal-code"
          value={address.postalCode}
          onChange={(e) => setAddress({ postalCode: e.target.value })}
          required
        />
        <Field
          label="Country"
          autoComplete="country-name"
          value={address.country}
          onChange={(e) => setAddress({ country: e.target.value })}
          required
        />
      </div>
    </>
  );
}

export const emptyDelivery = (): DeliveryForm => ({
  phone: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'US',
  },
});
