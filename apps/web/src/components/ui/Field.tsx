import type { InputHTMLAttributes } from 'react';

export type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Field({ label, id, ...props }: FieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label htmlFor={fieldId}>
      {label}
      <input id={fieldId} {...props} />
    </label>
  );
}
