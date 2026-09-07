import { useEffect, useState, type FormEvent } from 'react';
import { apiMessage, docId, http, urls, type Category } from '@/api';
import { Button, Field, Flash, PageLoader } from '@/components/ui';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [blurb, setBlurb] = useState('');
  const [slugError, setSlugError] = useState('');
  const [nameError, setNameError] = useState('');

  async function reload() {
    const { data } = await http.get<Category[]>(urls.categories);
    setRows(data);
  }

  useEffect(() => {
    setLoading(true);
    void reload()
      .catch((err) => setError(apiMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  function validate() {
    const nextSlug = slug.trim().toLowerCase();
    const nextName = name.trim();
    let ok = true;
    setSlugError('');
    setNameError('');
    if (!nextName) {
      setNameError('Enter a display name, e.g. Shoes.');
      ok = false;
    }
    if (!nextSlug) {
      setSlugError('Enter a slug, e.g. shoes.');
      ok = false;
    } else if (!SLUG_RE.test(nextSlug)) {
      setSlugError('Use lowercase letters, numbers, and hyphens only.');
      ok = false;
    }
    return ok;
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!validate()) {
      setError('Fix the highlighted fields and try again.');
      return;
    }
    setSaving(true);
    try {
      await http.post(urls.categories, {
        slug: slug.trim().toLowerCase(),
        name: name.trim(),
        blurb: blurb.trim(),
        showInNav: true,
        showOnHome: true,
      });
      setSlug('');
      setName('');
      setBlurb('');
      setNotice('Category added.');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Category) {
    setError('');
    setNotice('');
    try {
      await http.delete(urls.category(docId(row)));
      setNotice('Category removed.');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  if (loading) {
    return <PageLoader label="Loading categories…" />;
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Categories</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Taxonomy only. Featured is a product flag, not a category.
      </p>
      <Flash tone="success">{notice}</Flash>
      <Flash>{error}</Flash>
      <form
        onSubmit={(event) => void create(event)}
        className="mb-8 max-w-xl rounded-xl border border-zinc-200 bg-white p-6"
      >
        <Field
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          error={slugError}
          hint="URL-friendly id, e.g. shoes or new-arrivals."
          required
        />
        <Field
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          required
        />
        <Field
          label="Blurb"
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          hint="Short line shown on the shop home page."
        />
        <Button type="submit" loading={saving}>Add category</Button>
      </form>
      <ul className="grid max-w-xl gap-3">
        {rows.length === 0 ? (
          <li className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            No categories yet. Add one above.
          </li>
        ) : (
          rows.map((row) => (
            <li
              key={row.slug}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3"
            >
              <div>
                <strong>{row.name}</strong>
                <p className="text-sm text-zinc-500">{row.slug}</p>
              </div>
              <Button type="button" variant="danger" onClick={() => void remove(row)}>
                Delete
              </Button>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
