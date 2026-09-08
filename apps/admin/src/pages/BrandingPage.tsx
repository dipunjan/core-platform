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
import { Button, Field, Flash, ImagePicker, PageHeader, PageLoader, SelectField } from '@/components/ui';
import { brandImage, hasBrandImage } from '@/lib/brandImage';
import { confirmAction } from '@/lib/confirm';
import { useStorefront } from '@/hooks';

export function BrandingPage() {
  const {
    storefront: store,
    loading: storeLoading,
    error: loadError,
    remember,
  } = useStorefront();
  const [appName, setAppName] = useState('');
  const [tagline, setTagline] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [headline, setHeadline] = useState('');
  const [sub, setSub] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [href, setHref] = useState('');
  const [cta, setCta] = useState('');
  const [promoHeadline, setPromoHeadline] = useState('');
  const [promoSub, setPromoSub] = useState('');
  const [promoImage, setPromoImage] = useState('');
  const [promoHref, setPromoHref] = useState('');
  const [promoUploading, setPromoUploading] = useState(false);
  const [promoAttempted, setPromoAttempted] = useState(false);
  const [promoErrors, setPromoErrors] = useState<{
    headline?: string;
    image?: string;
    href?: string;
  }>({});
  const [editingBannerId, setEditingBannerId] = useState('');
  const [editPromoHeadline, setEditPromoHeadline] = useState('');
  const [editPromoSub, setEditPromoSub] = useState('');
  const [editPromoImage, setEditPromoImage] = useState('');
  const [editPromoHref, setEditPromoHref] = useState('');
  const [editPromoUploading, setEditPromoUploading] = useState(false);
  const [editPromoAttempted, setEditPromoAttempted] = useState(false);
  const [editPromoErrors, setEditPromoErrors] = useState<{
    headline?: string;
    image?: string;
    href?: string;
  }>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');

  function syncForm(data: Storefront) {
    setAppName(data.appName ?? '');
    setTagline(data.tagline ?? '');
    setFaviconUrl(data.faviconUrl ?? '');
    setLogoUrl(data.logoUrl ?? '');
    setCurrency(data.currency ?? 'USD');
    setHeadline(data.hero?.headline ?? '');
    setSub(data.hero?.sub ?? '');
    setImageUrl(data.hero?.imageUrl ?? '');
    setHref(data.hero?.href ?? '');
    setCta(data.hero?.cta ?? '');
  }

  function apply(data: Storefront) {
    remember(data);
    syncForm(data);
  }

  function clearStatus() {
    setError('');
    setNotice('');
  }

  useEffect(() => {
    if (store) {
      syncForm(store);
    }
  }, [store]);

  useEffect(() => {
    if (notice || error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [notice, error]);

  async function saveSite(event: FormEvent) {
    event.preventDefault();
    clearStatus();
    if (!appName.trim()) {
      setError('Enter a shop name.');
      return;
    }
    if (faviconUrl.startsWith('blob:')) {
      setError('Wait for the favicon upload to finish.');
      return;
    }
    setBusy('site');
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        appName: appName.trim(),
        tagline: tagline.trim(),
        faviconUrl,
      });
      apply(data);
      setNotice('Site identity saved.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function saveLogo(url: string) {
    setLogoUrl(url);
    if (url.startsWith('blob:')) {
      return;
    }
    clearStatus();
    setBusy('logo');
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        logoUrl: url,
      });
      apply(data);
      setNotice(url ? 'Logo updated.' : 'Logo removed.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function removeLogo() {
    await saveLogo('');
  }

  async function removeFavicon() {
    setFaviconUrl('');
    clearStatus();
    setBusy('site');
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        faviconUrl: '',
      });
      apply(data);
      setNotice('Favicon removed.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function removeHeroImage() {
    setImageUrl('');
    clearStatus();
    setBusy('hero');
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        hero: { headline, sub, imageUrl: '', href, cta },
      });
      apply(data);
      setNotice('Hero image removed.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function saveCurrency(event: FormEvent) {
    event.preventDefault();
    clearStatus();
    setBusy('currency');
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        currency,
      });
      apply(data);
      setNotice('Currency saved.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function saveHero(event: FormEvent) {
    event.preventDefault();
    clearStatus();
    if (!headline.trim()) {
      setError('Enter a hero headline.');
      return;
    }
    if (!href.trim()) {
      setError('Enter a button link for the hero.');
      return;
    }
    if (!cta.trim()) {
      setError('Enter a button label for the hero.');
      return;
    }
    if (imageUrl.startsWith('blob:')) {
      setError('Wait for the hero image upload to finish.');
      return;
    }
    setBusy('hero');
    try {
      const { data } = await http.patch<Storefront>(urls.storefront, {
        hero: {
          headline: headline.trim(),
          sub: sub.trim(),
          imageUrl,
          href: href.trim(),
          cta: cta.trim(),
        },
      });
      apply(data);
      setNotice('Hero saved.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy('');
    }
  }

  function validatePromo() {
    const next: { headline?: string; image?: string; href?: string } = {};
    if (!promoHeadline.trim()) {
      next.headline = 'Enter a headline for this tile.';
    }
    if (promoUploading || promoImage.startsWith('blob:')) {
      next.image = 'Wait for the image upload to finish.';
    } else if (!promoImage) {
      next.image = 'Choose an image for this tile.';
    }
    if (!promoHref.trim()) {
      next.href = 'Enter a link for this tile.';
    }
    return next;
  }

  function validateEditPromo() {
    const next: { headline?: string; image?: string; href?: string } = {};
    if (!editPromoHeadline.trim()) {
      next.headline = 'Enter a headline for this tile.';
    }
    if (editPromoUploading || editPromoImage.startsWith('blob:')) {
      next.image = 'Wait for the image upload to finish.';
    } else if (!editPromoImage) {
      next.image = 'Choose an image for this tile.';
    }
    if (!editPromoHref.trim()) {
      next.href = 'Enter a link for this tile.';
    }
    return next;
  }

  function startEditBanner(banner: Banner) {
    clearStatus();
    setEditingBannerId(docId(banner));
    setEditPromoHeadline(banner.headline);
    setEditPromoSub(banner.sub ?? '');
    setEditPromoImage(banner.imageUrl);
    setEditPromoHref(banner.href ?? '');
    setEditPromoAttempted(false);
    setEditPromoErrors({});
  }

  function cancelEditBanner() {
    setEditingBannerId('');
    setEditPromoHeadline('');
    setEditPromoSub('');
    setEditPromoImage('');
    setEditPromoHref('');
    setEditPromoAttempted(false);
    setEditPromoErrors({});
  }

  async function saveEditBanner(event: FormEvent) {
    event.preventDefault();
    clearStatus();
    setEditPromoAttempted(true);
    const fieldErrors = validateEditPromo();
    setEditPromoErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }
    const headline = editPromoHeadline.trim();
    setBusy(`edit-${editingBannerId}`);
    try {
      const { data } = await http.patch<Storefront>(urls.banner(editingBannerId), {
        headline,
        sub: editPromoSub.trim(),
        imageUrl: editPromoImage,
        href: editPromoHref.trim(),
      });
      apply(data);
      cancelEditBanner();
      setNotice('Promo tile updated.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function addBanner(event: FormEvent) {
    event.preventDefault();
    clearStatus();
    setPromoAttempted(true);
    const fieldErrors = validatePromo();
    setPromoErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }
    const headline = promoHeadline.trim();
    setBusy('promo');
    try {
      const { data } = await http.post<Storefront>(urls.banners, {
        headline,
        sub: promoSub.trim(),
        imageUrl: promoImage,
        href: promoHref.trim(),
      });
      apply(data);
      setPromoHeadline('');
      setPromoSub('');
      setPromoImage('');
      setPromoHref('');
      setPromoAttempted(false);
      setPromoErrors({});
      setNotice('Promo tile added.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function removeBanner(banner: Banner) {
    if (
      !confirmAction(
        `Remove promo tile "${banner.headline}"?`,
      )
    ) {
      return;
    }
    clearStatus();
    setBusy(`delete-${docId(banner)}`);
    try {
      if (editingBannerId === docId(banner)) {
        cancelEditBanner();
      }
      const { data } = await http.delete<Storefront>(urls.banner(docId(banner)));
      apply(data);
      setNotice('Promo tile removed.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy('');
    }
  }

  if (storeLoading && !store) {
    return <PageLoader label="Loading branding…" />;
  }

  return (
    <>
      <PageHeader title="Branding" />
      <Flash tone="success">{notice}</Flash>
      <Flash>{loadError || error}</Flash>
      <form
        onSubmit={(event) => void saveSite(event)}
        className="card mb-4"
        style={{ maxWidth: '36rem' }}
      >
        <div className="card-body">
        <h2 className="admin-section-title mb-3">Site identity</h2>
        <Field
          label="App / shop name"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          required
        />
        <Field
          label="Tagline"
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
        <Button type="submit" loading={busy === 'site'}>Save site identity</Button>
        </div>
      </form>
      <form
        onSubmit={(event) => void saveCurrency(event)}
        className="card mb-4"
        style={{ maxWidth: '36rem' }}
      >
        <div className="card-body">
        <h2 className="admin-section-title mb-3">Currency</h2>
        <SelectField
          label="Display currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {STORE_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </SelectField>
        <Button type="submit" loading={busy === 'currency'}>Save currency</Button>
        </div>
      </form>
      <section className="card mb-4" style={{ maxWidth: '36rem' }}>
        <div className="card-body">
        <h2 className="admin-section-title mb-3">Logo (header)</h2>
        <ImagePicker
          label="Logo file"
          kind="logo"
          value={logoUrl}
          onChange={(url) => void saveLogo(url)}
          onError={setError}
          onRemove={() => void removeLogo()}
        />
        </div>
      </section>
      <form
        onSubmit={(event) => void saveHero(event)}
        className="card mb-4"
        style={{ maxWidth: '36rem' }}
      >
        <div className="card-body">
        <h2 className="admin-section-title mb-3">Home hero</h2>
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
        <Button type="submit" loading={busy === 'hero'}>Save hero</Button>
        </div>
      </form>
      <section className="card" style={{ maxWidth: '36rem' }}>
        <div className="card-body">
        <h2 className="admin-section-title mb-3">Promo tiles</h2>
        <ul className="list-unstyled d-grid gap-3 mb-4">
          {(store?.banners ?? []).map((banner) => {
            const bannerId = docId(banner);
            const editing = editingBannerId === bannerId;
            return (
              <li
                key={bannerId}
                className={`card${editing ? ' admin-panel-edit' : ''}`}
              >
                <div className="card-body">
                {editing ? (
                  <form onSubmit={(event) => void saveEditBanner(event)} noValidate>
                    <Field
                      label="Headline"
                      value={editPromoHeadline}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditPromoHeadline(value);
                        if (editPromoAttempted && value.trim()) {
                          setEditPromoErrors((prev) => ({
                            ...prev,
                            headline: undefined,
                          }));
                        }
                      }}
                      required
                      error={editPromoAttempted ? editPromoErrors.headline : undefined}
                    />
                    <Field
                      label="Sub"
                      value={editPromoSub}
                      onChange={(e) => setEditPromoSub(e.target.value)}
                    />
                    <ImagePicker
                      label="Tile image"
                      kind="promo"
                      required
                      value={editPromoImage}
                      onChange={(url) => {
                        setEditPromoImage(url);
                        if (
                          editPromoAttempted &&
                          url &&
                          !url.startsWith('blob:') &&
                          !editPromoUploading
                        ) {
                          setEditPromoErrors((prev) => ({ ...prev, image: undefined }));
                        }
                      }}
                      onBusyChange={(uploading) => {
                        setEditPromoUploading(uploading);
                        if (editPromoAttempted && uploading) {
                          setEditPromoErrors((prev) => ({
                            ...prev,
                            image: 'Wait for the image upload to finish.',
                          }));
                        }
                      }}
                      onError={setError}
                      error={editPromoAttempted ? editPromoErrors.image : undefined}
                    />
                    <Field
                      label="Link"
                      value={editPromoHref}
                      onChange={(e) => setEditPromoHref(e.target.value)}
                      required
                      error={editPromoAttempted ? editPromoErrors.href : undefined}
                    />
                    <div className="d-flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        loading={busy === `edit-${bannerId}`}
                      >
                        Save changes
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={cancelEditBanner}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div className="d-flex min-w-0 gap-3">
                      <div>
                        <img
                          src={brandImage(banner.imageUrl, 'promo')}
                          alt=""
                          className="rounded border object-fit-cover flex-shrink-0"
                          style={{ height: '3.5rem', width: '6rem' }}
                        />
                        <span
                          className={`badge mt-1 ${
                            hasBrandImage(banner.imageUrl)
                              ? 'text-bg-success'
                              : 'text-bg-secondary'
                          }`}
                        >
                          {hasBrandImage(banner.imageUrl) ? 'Live' : 'Placeholder'}
                        </span>
                      </div>
                      <div>
                        <p className="fw-semibold mb-0">{banner.headline}</p>
                        <p className="small text-muted mb-0">{banner.sub}</p>
                      </div>
                    </div>
                    <div className="d-flex flex-shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => startEditBanner(banner)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        loading={busy === `delete-${bannerId}`}
                        loadingLabel="Deleting…"
                        onClick={() => void removeBanner(banner)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
                </div>
              </li>
            );
          })}
        </ul>
        <form onSubmit={(event) => void addBanner(event)} noValidate>
          <Field
            label="Headline"
            value={promoHeadline}
            onChange={(e) => {
              const value = e.target.value;
              setPromoHeadline(value);
              if (promoAttempted && value.trim()) {
                setPromoErrors((prev) => ({ ...prev, headline: undefined }));
              }
            }}
            required
            error={promoAttempted ? promoErrors.headline : undefined}
          />
          <Field
            label="Sub"
            value={promoSub}
            onChange={(e) => setPromoSub(e.target.value)}
          />
          <ImagePicker
            label="Tile image"
            kind="promo"
            required
            value={promoImage}
            onChange={(url) => {
              setPromoImage(url);
              if (
                promoAttempted &&
                url &&
                !url.startsWith('blob:') &&
                !promoUploading
              ) {
                setPromoErrors((prev) => ({ ...prev, image: undefined }));
              }
            }}
            onBusyChange={(uploading) => {
              setPromoUploading(uploading);
              if (promoAttempted && uploading) {
                setPromoErrors((prev) => ({
                  ...prev,
                  image: 'Wait for the image upload to finish.',
                }));
              }
            }}
            onError={setError}
            error={promoAttempted ? promoErrors.image : undefined}
          />
          <Field
            label="Link"
            value={promoHref}
            onChange={(e) => setPromoHref(e.target.value)}
            required
            error={promoAttempted ? promoErrors.href : undefined}
          />
          <Button type="submit" loading={busy === 'promo'}>
            Add tile
          </Button>
        </form>
        </div>
      </section>
    </>
  );
}
