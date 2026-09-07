import { Field } from '@/components/ui';
import type { Address } from '@/api';

type Props = {
  value: Address;
  onChange: (next: Address) => void;
};

export function AddressFields({ value, onChange }: Props) {
  function set(patch: Partial<Address>) {
    onChange({ ...value, ...patch });
  }

  return (
    <>
      <Field
        label="Address"
        autoComplete="address-line1"
        value={value.line1}
        onChange={(e) => set({ line1: e.target.value })}
        required
      />
      <Field
        label="Apt, suite (optional)"
        autoComplete="address-line2"
        value={value.line2 ?? ''}
        onChange={(e) => set({ line2: e.target.value })}
      />
      <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
        <Field
          label="City"
          autoComplete="address-level2"
          value={value.city}
          onChange={(e) => set({ city: e.target.value })}
          required
        />
        <Field
          label="State / region"
          autoComplete="address-level1"
          value={value.region}
          onChange={(e) => set({ region: e.target.value })}
          required
        />
      </div>
      <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
        <Field
          label="ZIP / postal code"
          autoComplete="postal-code"
          value={value.postalCode}
          onChange={(e) => set({ postalCode: e.target.value })}
          required
        />
        <Field
          label="Country"
          autoComplete="country-name"
          value={value.country}
          onChange={(e) => set({ country: e.target.value })}
          required
        />
      </div>
    </>
  );
}

export const emptyAddress = (): Address => ({
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'US',
});
