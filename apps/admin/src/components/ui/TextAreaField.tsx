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
    <label
      htmlFor={fieldId}
      className="mb-4 grid gap-1.5 text-sm font-medium text-zinc-700"
    >
      <span>
        {label}
        {required ? (
          <span className="text-red-600" aria-hidden="true"> *</span>
        ) : null}
      </span>
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={`resize-y rounded-lg border bg-white px-3 py-2 font-normal text-zinc-900 shadow-sm outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:border-red-600 focus:ring-red-600/20'
            : 'border-zinc-300 focus:border-emerald-700 focus:ring-emerald-700/20'
        } ${className}`.trim()}
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
