import { useState } from 'react';
import { apiMessage, http, urls } from '@/api';

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onError?: (message: string) => void;
};

export function ImagePicker({ label, value, onChange, onError }: Props) {
  const [busy, setBusy] = useState(false);

  async function onPick(file: File | undefined) {
    if (!file) {
      return;
    }
    const preview = URL.createObjectURL(file);
    onChange(preview);
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
      <p className="mb-1.5 text-sm font-medium text-zinc-700">{label}</p>
      {value ? (
        <img
          src={value}
          alt=""
          className="mb-3 h-24 w-full max-w-xs rounded-lg object-cover"
        />
      ) : (
        <div className="mb-3 flex h-24 max-w-xs items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-400">
          No image
        </div>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        disabled={busy}
        onChange={(event) => void onPick(event.target.files?.[0])}
        className="block text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
      />
      {busy ? (
        <p className="mt-1 text-xs text-zinc-500">Uploading…</p>
      ) : null}
    </div>
  );
}
