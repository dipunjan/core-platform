import { useEffect, useState } from 'react';
import { apiMessage, http, urls } from '@/api';
import {
  brandImage,
  hasBrandImage,
  type BrandImageKind,
} from '@/lib/brandImage';
import { SpinnerIcon } from './Spinner';

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onError?: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  kind?: BrandImageKind;
  onRemove?: () => void;
};

export function ImagePicker({
  label,
  value,
  onChange,
  onError,
  onBusyChange,
  required = false,
  hint,
  error,
  kind = 'logo',
  onRemove,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);
  const live = hasBrandImage(value) && !broken;
  const preview =
    value.startsWith('blob:') || (hasBrandImage(value) && !broken)
      ? value.startsWith('blob:')
        ? value
        : value.trim()
      : brandImage(value, kind);

  useEffect(() => {
    setBroken(false);
  }, [value]);

  async function onPick(file: File | undefined) {
    if (!file) {
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    onChange(previewUrl);
    setBusy(true);
    onBusyChange?.(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await http.post<{ url: string }>(
        urls.storefrontAssets,
        body,
      );
      onChange(data.url);
    } catch (err) {
      onChange('');
      onError?.(apiMessage(err, 'Could not upload that image'));
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  const hintId = hint ? `picker-${kind}-hint` : undefined;
  const errorId = error ? `picker-${kind}-error` : undefined;

  return (
    <div className="mb-3">
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <p className="form-label mb-0">
          {label}
          {required ? (
            <span className="text-danger" aria-hidden="true"> *</span>
          ) : null}
        </p>
        <span
          className={`badge ${live ? 'text-bg-success' : 'text-bg-secondary'}`}
        >
          {live ? 'Live on shop' : 'Placeholder on shop'}
        </span>
      </div>
      <img
        src={preview}
        alt=""
        onError={() => setBroken(true)}
        className={`mb-3 rounded object-fit-cover${error ? ' border border-danger' : ' border'}`}
        style={{ height: '6rem', maxWidth: '20rem', width: '100%' }}
      />
      <div className="d-flex flex-wrap align-items-center gap-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          disabled={busy}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          onChange={(event) => void onPick(event.target.files?.[0])}
          className={`form-control form-control-sm${error ? ' is-invalid' : ''}`}
          style={{ maxWidth: '20rem' }}
        />
        {value.trim() && onRemove ? (
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="btn btn-outline-secondary btn-sm"
          >
            Remove
          </button>
        ) : null}
      </div>
      {busy ? (
        <p className="mt-1 d-flex align-items-center gap-2 form-text mb-0">
          <SpinnerIcon />
          Uploading…
        </p>
      ) : error ? (
        <div id={errorId} className="invalid-feedback d-block" role="alert">
          {error}
        </div>
      ) : hint ? (
        <p id={hintId} className="form-text mb-0">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
