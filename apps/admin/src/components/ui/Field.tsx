import type { InputHTMLAttributes } from 'react';
import { fieldShellClass, inputControlClass } from './fieldStyles';

export type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Field({
  label,
  id,
  className = '',
  hint,
  error,
  required,
  ...props
}: FieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <label htmlFor={fieldId} className={fieldShellClass(className)}>
      <span>
        {label}
        {required ? (
          <span className="text-red-600" aria-hidden="true"> *</span>
        ) : null}
      </span>
      <input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={inputControlClass(error)}
        {...props}
      />
      {hint && !error ? (
        <span id={hintId} className="text-xs font-normal text-zinc-500">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="text-xs font-normal text-red-700" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
