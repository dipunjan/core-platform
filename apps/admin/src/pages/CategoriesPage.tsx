import { useEffect, useState, type FormEvent } from 'react';
import { apiMessage, docId, http, urls, type Category } from '@/api';
import { Button, Field, Flash } from '@/components/ui';

export function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [blurb, setBlurb] = useState('');

  async function reload() {
    const { data } = await http.get<Category[]>(urls.categories);
    setRows(data);
  }

  useEffect(() => {
    void reload().catch((err) => setError(apiMessage(err)));
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await http.post(urls.categories, {
        slug,
        name,
        blurb,
        showInNav: true,
        showOnHome: true,
      });
      setSlug('');
      setName('');
      setBlurb('');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function remove(row: Category) {
    setError('');
    try {
      await http.delete(urls.category(docId(row)));
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Categories</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Taxonomy only. Featured is a product flag, not a category.
      </p>
      <Flash>{error}</Flash>
      <form
        onSubmit={(event) => void create(event)}
        className="mb-8 max-w-xl rounded-xl border border-zinc-200 bg-white p-6"
      >
        <Field
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <Field
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Field
          label="Blurb"
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
        />
        <Button type="submit">Add category</Button>
      </form>
      <ul className="grid max-w-xl gap-3">
        {rows.map((row) => (
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
        ))}
      </ul>
    </>
  );
}
