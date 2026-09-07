import { useState } from 'react';
import { apiMessage, http, urls } from '@/api';
import {
  brandImage,
  hasBrandImage,
  type BrandImageKind,
} from '@/lib/brandImage';

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onError?: (message: string) => void;
  kind?: BrandImageKind;
  onRemove?: () => void;
};

export function ImagePicker({
  label,
  value,
  onChange,
  onError,
  kind = 'logo',
  onRemove,
}: Props) {
  const [busy, setBusy] = useState(false);
  const live = hasBrandImage(value);
  const preview = value.startsWith('blob:') ? value : brandImage(value, kind);

  async function onPick(file: File | undefined) {
    if (!file) {
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    onChange(previewUrl);
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await http.post<{ url: string }>(
        urls.storefrontAssets,
        body,
      );
      onChange(data.url);
    } catch (err) {
      onError?.(apiMessage(err, 'Could not upload that image'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-700">{label}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            live
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {live ? 'Live on shop' : 'Placeholder on shop'}
        </span>
      </div>
      <img
        src={preview}
        alt=""
        className="mb-3 h-24 w-full max-w-xs rounded-lg border border-zinc-200 object-cover"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          disabled={busy}
          onChange={(event) => void onPick(event.target.files?.[0])}
          className="block text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        {live && onRemove ? (
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Remove
          </button>
        ) : null}
      </div>
      {busy ? (
        <p className="mt-1 text-xs text-zinc-500">Uploading…</p>
      ) : null}
    </div>
  );
}
