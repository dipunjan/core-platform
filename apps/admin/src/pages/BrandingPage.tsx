import { useEffect, useState, type FormEvent } from 'react';
import {
  STORE_CURRENCIES,
  apiMessage,
  docId,
  http,
  urls,
  type Banner,
  type Storefront,
} from '@/api';
import { Button, Field, Flash, ImagePicker } from '@/components/ui';
import { brandImage, hasBrandImage } from '@/lib/brandImage';
import { useStorefront } from '@/hooks';

export function BrandingPage() {
  const { storefront: store, remember } = useStorefront();
  const [appName, setAppName] = useState('');
  const [tagline, setTagline] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [headline, setHeadline] = useState('');
  const [sub, setSub] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [href, setHref] = useState('/shop');
  const [cta, setCta] = useState('Shop all');
  const [promoHeadline, setPromoHeadline] = useState('');
  const [promoSub, setPromoSub] = useState('');
  const [promoImage, setPromoImage] = useState('');
  const [promoHref, setPromoHref] = useState('/shop');
  const [error, setError] = useState('');

  function syncForm(data: Storefront) {
    setAppName(data.appName ?? '');
    setTagline(data.tagline ?? '');
    setFaviconUrl(data.faviconUrl ?? '');
    setLogoUrl(data.logoUrl ?? '');
    setCurrency(data.currency ?? 'USD');
    setHeadline(data.hero?.headline ?? '');
    setSub(data.hero?.sub ?? '');
    setImageUrl(data.hero?.imageUrl ?? '');
    setHref(data.hero?.href ?? '/shop');
    setCta(data.hero?.cta ?? 'Shop all');
  }

  function apply(data: Storefront) {
    remember(data);
    syncForm(data);
  }

  useEffect(() => {
    if (store) {
      syncForm(store);
    }
  }, [store]);

  async function saveSite(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (faviconUrl.startsWith('blob:')) {
      setError('Wait for the favicon upload to finish.');
      return;
    }
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        appName,
        tagline,
        faviconUrl,
      });
      apply(data);
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function saveLogo(url: string) {
    setLogoUrl(url);
    if (url.startsWith('blob:')) {
      return;
    }
    setError('');
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        logoUrl: url,
      });
      apply(data);
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function removeLogo() {
    await saveLogo('');
  }

  async function removeFavicon() {
    setFaviconUrl('');
    setError('');
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        faviconUrl: '',
      });
      apply(data);
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function removeHeroImage() {
    setImageUrl('');
    setError('');
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        hero: { headline, sub, imageUrl: '', href, cta },
      });
      apply(data);
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function saveCurrency(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        currency,
      });
      apply(data);
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function saveHero(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (imageUrl.startsWith('blob:')) {
      setError('Wait for the image upload to finish.');
      return;
    }
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        hero: { headline, sub, imageUrl, href, cta },
      });
      apply(data);
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function addBanner(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!promoImage || promoImage.startsWith('blob:')) {
      setError('Choose a promo image and wait for the upload to finish.');
      return;
    }
    try {
      const { data } = await http.post<Storefront>(urls.banners, {
        headline: promoHeadline,
        sub: promoSub,
        imageUrl: promoImage,
        href: promoHref,
      });
      apply(data);
      setPromoHeadline('');
      setPromoSub('');
      setPromoImage('');
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function removeBanner(banner: Banner) {
    setError('');
    try {
      const { data } = await http.delete<Storefront>(urls.banner(docId(banner)));
      apply(data);
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Branding</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Uploaded images are live on the shop. Empty slots show a placeholder on
        the website until you upload something.
      </p>
      <Flash>{error}</Flash>
      <form
        onSubmit={(event) => void saveSite(event)}
        className="mb-10 max-w-xl rounded-xl border border-zinc-200 bg-white p-6"
      >
        <h2 className="mb-4 font-semibold">Site identity</h2>
        <Field
          label="App / shop name"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          required
        />
        <Field
          label="Home tagline (small line above hero headline)"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
        <ImagePicker
          label="Favicon"
          kind="favicon"
          value={faviconUrl}
          onChange={setFaviconUrl}
          onError={setError}
          onRemove={() => void removeFavicon()}
        />
        <Button type="submit">Save site identity</Button>
      </form>
      <form
        onSubmit={(event) => void saveCurrency(event)}
        className="mb-10 max-w-xl rounded-xl border border-zinc-200 bg-white p-6"
      >
        <h2 className="mb-4 font-semibold">Currency</h2>
        <label className="mb-4 grid gap-1.5 text-sm font-medium text-zinc-700">
          Display currency
          <select
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {STORE_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit">Save currency</Button>
      </form>
      <section className="mb-10 max-w-xl rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Logo (header)</h2>
        <ImagePicker
          label="Logo file"
          kind="logo"
          value={logoUrl}
          onChange={(url) => void saveLogo(url)}
          onError={setError}
          onRemove={() => void removeLogo()}
        />
      </section>
      <form
        onSubmit={(event) => void saveHero(event)}
        className="mb-10 max-w-xl rounded-xl border border-zinc-200 bg-white p-6"
      >
        <h2 className="mb-4 font-semibold">Home hero</h2>
        <Field
          label="Headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          required
        />
        <Field label="Sub" value={sub} onChange={(e) => setSub(e.target.value)} />
        <ImagePicker
          label="Background image"
          kind="hero"
          value={imageUrl}
          onChange={setImageUrl}
          onError={setError}
          onRemove={() => void removeHeroImage()}
        />
        <Field
          label="Button label"
          value={cta}
          onChange={(e) => setCta(e.target.value)}
        />
        <Field
          label="Button link"
          value={href}
          onChange={(e) => setHref(e.target.value)}
        />
        <Button type="submit">Save hero</Button>
      </form>
      <section className="max-w-xl rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Promo tiles (under the hero)</h2>
        <ul className="mb-6 grid gap-3">
          {(store?.banners ?? []).map((banner) => (
            <li
              key={docId(banner)}
              className="flex items-start justify-between gap-3 rounded-lg border border-zinc-100 p-3"
            >
              <div className="flex min-w-0 gap-3">
                <div>
                  <img
                    src={brandImage(banner.imageUrl, 'promo')}
                    alt=""
                    className="h-14 w-24 shrink-0 rounded-md border border-zinc-200 object-cover"
                  />
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      hasBrandImage(banner.imageUrl)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {hasBrandImage(banner.imageUrl) ? 'Live' : 'Placeholder'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{banner.headline}</p>
                  <p className="text-sm text-zinc-500">{banner.sub}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={() => void removeBanner(banner)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
        <form onSubmit={(event) => void addBanner(event)}>
          <Field
            label="Headline"
            value={promoHeadline}
            onChange={(e) => setPromoHeadline(e.target.value)}
            required
          />
          <Field
            label="Sub"
            value={promoSub}
            onChange={(e) => setPromoSub(e.target.value)}
          />
          <ImagePicker
            label="Tile image"
            kind="promo"
            value={promoImage}
            onChange={setPromoImage}
            onError={setError}
          />
          <Field
            label="Link"
            value={promoHref}
            onChange={(e) => setPromoHref(e.target.value)}
          />
          <Button type="submit">Add tile</Button>
        </form>
      </section>
    </>
  );
}
