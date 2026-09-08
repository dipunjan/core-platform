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
      <div className="row">
        <div className="col-md-6">
          <Field
            className="mb-md-3"
            label="City"
            autoComplete="address-level2"
            value={value.city}
            onChange={(e) => set({ city: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <Field
            className="mb-md-3"
            label="State / region"
            autoComplete="address-level1"
            value={value.region}
            onChange={(e) => set({ region: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
          <Field
            className="mb-md-0"
            label="ZIP / postal code"
            autoComplete="postal-code"
            value={value.postalCode}
            onChange={(e) => set({ postalCode: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <Field
            className="mb-md-0"
            label="Country"
            autoComplete="country-name"
            value={value.country}
            onChange={(e) => set({ country: e.target.value })}
            required
          />
        </div>
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
