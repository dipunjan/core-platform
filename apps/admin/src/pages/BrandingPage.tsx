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
import { useStorefront } from '@/hooks';

export function BrandingPage() {
  const { storefront: store, remember } = useStorefront();
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

  function apply(data: Storefront) {
    remember(data);
    setLogoUrl(data.logoUrl);
    setCurrency(data.currency ?? 'USD');
    setHeadline(data.hero?.headline ?? '');
    setSub(data.hero?.sub ?? '');
    setImageUrl(data.hero?.imageUrl ?? '');
    setHref(data.hero?.href ?? '/shop');
    setCta(data.hero?.cta ?? 'Shop all');
  }

  useEffect(() => {
    void http
      .get<Storefront>(urls.storefront)
      .then(({ data }) => apply(data))
      .catch((err) => setError(apiMessage(err)));
  }, []);

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
        Pick images from your computer. Prices on the shop use the currency you
        save here. Amounts in the catalog stay in minor units (cents, paise).
      </p>
      <Flash>{error}</Flash>
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
        <h2 className="mb-4 font-semibold">Logo</h2>
        <ImagePicker
          label="Logo file"
          value={logoUrl}
          onChange={(url) => void saveLogo(url)}
          onError={setError}
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
          value={imageUrl}
          onChange={setImageUrl}
          onError={setError}
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
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                ) : null}
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
