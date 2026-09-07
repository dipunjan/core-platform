export const inputControlClass = (error?: string) =>
  `form-control${error ? ' form-control-error' : ''}`;

export const selectControlClass = (error?: string) =>
  `form-control form-select${error ? ' form-control-error' : ''}`;

export const textareaControlClass = (error?: string) =>
  `form-textarea${error ? ' form-control-error' : ''}`;

export const fieldShellClass = (className = '') =>
  `mb-4 grid w-full min-w-0 gap-1.5 text-sm font-medium text-zinc-700 ${className}`.trim();
