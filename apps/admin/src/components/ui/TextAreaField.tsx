import type { TextareaHTMLAttributes } from 'react';

export type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextAreaField({
  label,
  id,
  className = '',
  hint,
  error,
  required,
  rows = 3,
  ...props
}: TextAreaFieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={`mb-3 ${className}`.trim()}>
      <label htmlFor={fieldId} className="form-label">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true"> *</span>
        ) : null}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={`form-control${error ? ' is-invalid' : ''}`}
        {...props}
      />
      {hint && !error ? (
        <div id={hintId} className="form-text">
          {hint}
        </div>
      ) : null}
      {error ? (
        <div id={errorId} className="invalid-feedback" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}
