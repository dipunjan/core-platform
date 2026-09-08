import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { Address } from '@/api';
import { Field } from '@/components/ui';
import type { DeliveryFormValues } from '@/lib/schemas';

export type DeliveryForm = {
  phone: string;
  address: Address;
};

type ControlledProps = {
  value: DeliveryForm;
  onChange: (next: DeliveryForm) => void;
};

type RegisterProps = {
  register: UseFormRegister<DeliveryFormValues>;
  errors: FieldErrors<DeliveryFormValues>;
};

type Props = ControlledProps | RegisterProps;

function isRegisterProps(props: Props): props is RegisterProps {
  return 'register' in props;
}

export function AddressFields(props: Props) {
  if (isRegisterProps(props)) {
    const { register, errors } = props;
    return (
      <>
        <Field
          label="Mobile phone"
          type="tel"
          autoComplete="tel"
          required
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Field
          label="Address"
          autoComplete="address-line1"
          required
          {...register('address.line1')}
          error={errors.address?.line1?.message}
        />
        <Field
          label="Apt, suite (optional)"
          autoComplete="address-line2"
          {...register('address.line2')}
          error={errors.address?.line2?.message}
        />
        <div className="row g-3">
          <div className="col-md-6">
            <Field
              className="mb-0"
              label="City"
              autoComplete="address-level2"
              required
              {...register('address.city')}
              error={errors.address?.city?.message}
            />
          </div>
          <div className="col-md-6">
            <Field
              className="mb-0"
              label="State / region"
              autoComplete="address-level1"
              required
              {...register('address.region')}
              error={errors.address?.region?.message}
            />
          </div>
        </div>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <Field
              className="mb-0"
              label="ZIP / postal code"
              autoComplete="postal-code"
              required
              {...register('address.postalCode')}
              error={errors.address?.postalCode?.message}
            />
          </div>
          <div className="col-md-6">
            <Field
              className="mb-0"
              label="Country"
              autoComplete="country-name"
              required
              {...register('address.country')}
              error={errors.address?.country?.message}
            />
          </div>
        </div>
      </>
    );
  }

  const { phone, address } = props.value;
  function setAddress(patch: Partial<Address>) {
    props.onChange({ phone, address: { ...address, ...patch } });
  }

  return (
    <>
      <Field
        label="Mobile phone"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => props.onChange({ phone: e.target.value, address })}
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
      <div className="row g-3">
        <div className="col-md-6">
          <Field
            className="mb-0"
            label="City"
            autoComplete="address-level2"
            value={address.city}
            onChange={(e) => setAddress({ city: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <Field
            className="mb-0"
            label="State / region"
            autoComplete="address-level1"
            value={address.region}
            onChange={(e) => setAddress({ region: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <Field
            className="mb-0"
            label="ZIP / postal code"
            autoComplete="postal-code"
            value={address.postalCode}
            onChange={(e) => setAddress({ postalCode: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <Field
            className="mb-0"
            label="Country"
            autoComplete="country-name"
            value={address.country}
            onChange={(e) => setAddress({ country: e.target.value })}
            required
          />
        </div>
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
