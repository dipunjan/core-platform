import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function SelectField({
  label,
  id,
  className = '',
  hint,
  error,
  required,
  children,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={cn('mb-3', className)}>
      <label htmlFor={fieldId} className="form-label fw-semibold">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true"> *</span>
        ) : null}
      </label>
      <select
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={cn('form-select', error && 'is-invalid')}
        {...props}
      >
        {children}
      </select>
      {hint && !error ? (
        <div id={hintId} className="form-text">
          {hint}
        </div>
      ) : null}
      {error ? (
        <div id={errorId} className="invalid-feedback d-block" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}
