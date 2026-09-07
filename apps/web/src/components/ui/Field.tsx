import type { InputHTMLAttributes } from 'react';

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
  ...props
}: FieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const message = error ?? hint;
  const messageId = message ? `${fieldId}-hint` : undefined;
  return (
    <label
      htmlFor={fieldId}
      className="mb-4 grid gap-1.5 text-sm font-medium text-zinc-700"
    >
      {label}
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={`rounded-lg border bg-white px-3 py-2 font-normal text-zinc-900 shadow-sm outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:border-red-600 focus:ring-red-600/20'
            : 'border-zinc-300 focus:border-emerald-700 focus:ring-emerald-700/20'
        } ${className}`.trim()}
        {...props}
      />
      {message ? (
        <span
          id={messageId}
          className={`text-xs font-normal ${error ? 'text-red-700' : 'text-zinc-500'}`}
        >
          {message}
        </span>
      ) : null}
    </label>
  );
}
