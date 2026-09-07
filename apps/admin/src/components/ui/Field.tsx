import type { InputHTMLAttributes } from 'react';

export type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Field({ label, id, className = '', ...props }: FieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label htmlFor={fieldId} className="mb-4 grid gap-1.5 text-sm font-medium text-zinc-700">
      {label}
      <input
        id={fieldId}
        className={`rounded-lg border border-zinc-300 bg-white px-3 py-2 font-normal text-zinc-900 shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 ${className}`.trim()}
        {...props}
      />
    </label>
  );
}
