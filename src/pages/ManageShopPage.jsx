import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import shopsApi from '../services/shopsApi';
import { SHOP_CATEGORIES } from '../data/shopConfig';
import './AddListingPage.css';
import './ManageShopPage.css';

// Downscale a logo to a small base64 JPEG (same approach as profile avatars).
function fileToDataUrl(file, max = 320, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}

const BLANK = {
  name: '', shopCategory: '', sells: '', description: '', location: '',
  phone: '', whatsapp: '', openingHours: '', deliveryAvailable: false, logoUrl: '',
};

const STATUS_LABEL = { pending: 'Pending approval', approved: 'Approved & visible', hidden: 'Hidden by admin' };

export default function ManageShopPage() {
  const { isAuthenticated, loading, userType, isApprovedBusiness, profile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [existing, setExisting] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loading || !isApprovedBusiness) return;
    let active = true;
    shopsApi.mine().then((res) => {
      if (!active) return;
      if (res.shop) {
        setExisting(res.shop);
        setForm({ ...BLANK, ...res.shop, sells: res.shop.sells || '', description: res.shop.description || '',
          whatsapp: res.shop.whatsapp || '', openingHours: res.shop.openingHours || '', logoUrl: res.shop.logoUrl || '' });
      } else {
        // Pre-fill from the business profile where sensible.
        setForm({ ...BLANK, name: profile?.businessName || '', phone: profile?.phone || '', location: profile?.area || 'Malir Cantt' });
      }
      setReady(true);
    }).catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [loading, isApprovedBusiness, profile]);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const onLogo = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try { const url = await fileToDataUrl(f); setForm((p) => ({ ...p, logoUrl: url })); } catch { /* ignore */ }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Shop name is required.';
    if (!form.shopCategory) errs.shopCategory = 'Pick a category.';
    if (!form.location.trim()) errs.location = 'Location is required.';
    if (!/^0\d{3}-?\d{7}$/.test(form.phone.trim())) errs.phone = 'Enter a valid phone (03XX-XXXXXXX).';
    if (form.whatsapp && !/^0\d{3}-?\d{7}$/.test(form.whatsapp.trim())) errs.whatsapp = 'Enter a valid WhatsApp number.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      name: form.name.trim(), shopCategory: form.shopCategory,
      sells: form.sells.trim() || null, description: form.description.trim() || null,
      location: form.location.trim(), phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim() || null, openingHours: form.openingHours.trim() || null,
      deliveryAvailable: !!form.deliveryAvailable, logoUrl: form.logoUrl || null,
    };
    setSaving(true); setErrors({});
    try {
      const res = existing ? await shopsApi.updateMine(payload) : await shopsApi.create(payload);
      setExisting(res.shop); setSaved(true);
      setTimeout(() => setSaved(false), 3500);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrors({ submit: err?.message || 'Could not save your shop. Please try again.' });
    } finally { setSaving(false); }
  };

  if (loading) {
    return <PageTransition><main className="add-listing"><LoadingState label="Loading…" /></main></PageTransition>;
  }
  if (!isAuthenticated) { navigate('/login?redirect=/my-shop'); return null; }
  if (!isApprovedBusiness) {
    return (
      <PageTransition>
        <main className="add-listing"><div className="add-listing__inner">
          <div className="manage-shop__gate">
            <h1>Approved business required</h1>
            <p>Shop profiles are for <strong>approved Business Seller</strong> accounts. {userType === 'business'
              ? 'Your business account is awaiting approval.'
              : 'Register a business account and get approved to add your shop.'}</p>
            <Link to={userType === 'business' ? '/profile' : '/login?register=business'} className="manage-shop__cta">
              {userType === 'business' ? 'View business status' : 'Register a business'}
            </Link>
          </div>
        </div></main>
      </PageTransition>
    );
  }
  if (!ready) {
    return <PageTransition><main className="add-listing"><LoadingState label="Loading…" /></main></PageTransition>;
  }

  return (
    <PageTransition>
      <main className="add-listing">
        <div className="add-listing__inner">
          <h1 className="add-listing__title">{existing ? 'Edit your shop' : 'Create your shop'}</h1>

          {existing && (
            <div className={`manage-shop__status manage-shop__status--${existing.status}`}>
              Status: <strong>{STATUS_LABEL[existing.status] || existing.status}</strong>
              {existing.status === 'approved' && <> · <Link to={`/shops/${existing.id}`}>View public page</Link></>}
            </div>
          )}
          {saved && <div className="manage-shop__saved">Shop saved.</div>}

          <form className="add-listing__form" onSubmit={submit} noValidate>
            <div className="form-card">
              <h2 className="form-card__heading">Shop details</h2>

              <div className="form-group">
                <label className="form-label" htmlFor="ms-name">Shop name <span className="form-required">*</span></label>
                <input id="ms-name" name="name" className={`form-input${errors.name ? ' form-input--error' : ''}`} value={form.name} onChange={change} placeholder="e.g. Owner Mart" />
                {errors.name && <p className="form-error" role="alert">{errors.name}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ms-cat">Shop category <span className="form-required">*</span></label>
                <div className="form-select-wrap">
                  <select id="ms-cat" name="shopCategory" className="form-select" value={form.shopCategory} onChange={change}>
                    <option value="">Select a category</option>
                    {SHOP_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                  </select>
                </div>
                {errors.shopCategory && <p className="form-error" role="alert">{errors.shopCategory}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ms-sells">What you sell</label>
                <input id="ms-sells" name="sells" className="form-input" value={form.sells} onChange={change} placeholder="e.g. mobile phones, chargers, repairs" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ms-desc">Description</label>
                <textarea id="ms-desc" name="description" className="form-input" rows={4} value={form.description} onChange={change} placeholder="Tell residents about your shop…" />
              </div>

              <div className="form-group">
                <label className="form-label">Shop logo</label>
                <div className="manage-shop__logo-row">
                  <span className="manage-shop__logo">{form.logoUrl ? <img src={form.logoUrl} alt="" /> : (form.name || 'S')[0]?.toUpperCase()}</span>
                  <button type="button" className="form-inline-link" onClick={() => fileRef.current?.click()}>{form.logoUrl ? 'Change logo' : 'Upload logo'}</button>
                  {form.logoUrl && <button type="button" className="form-inline-link form-inline-link--danger" onClick={() => setForm((p) => ({ ...p, logoUrl: '' }))}>Remove</button>}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onLogo} />
                </div>
              </div>
            </div>

            <div className="form-card">
              <h2 className="form-card__heading">Contact & location</h2>
              <div className="form-group">
                <label className="form-label" htmlFor="ms-loc">Location in Malir Cantt <span className="form-required">*</span></label>
                <input id="ms-loc" name="location" className={`form-input${errors.location ? ' form-input--error' : ''}`} value={form.location} onChange={change} placeholder="e.g. Sector B, Main Market" />
                {errors.location && <p className="form-error" role="alert">{errors.location}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ms-phone">Phone <span className="form-required">*</span></label>
                <input id="ms-phone" name="phone" className={`form-input${errors.phone ? ' form-input--error' : ''}`} value={form.phone} onChange={change} placeholder="03XX-XXXXXXX" />
                {errors.phone && <p className="form-error" role="alert">{errors.phone}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ms-wa">WhatsApp (if different)</label>
                <input id="ms-wa" name="whatsapp" className={`form-input${errors.whatsapp ? ' form-input--error' : ''}`} value={form.whatsapp} onChange={change} placeholder="03XX-XXXXXXX" />
                {errors.whatsapp && <p className="form-error" role="alert">{errors.whatsapp}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ms-hours">Opening hours</label>
                <input id="ms-hours" name="openingHours" className="form-input" value={form.openingHours} onChange={change} placeholder="e.g. 9am – 10pm, daily" />
              </div>
              <label className="manage-shop__check">
                <input type="checkbox" name="deliveryAvailable" checked={form.deliveryAvailable} onChange={change} />
                <span>Delivery available</span>
              </label>
            </div>

            {errors.submit && <p className="form-error" role="alert">{errors.submit}</p>}
            <button type="submit" className="add-listing__submit" disabled={saving}>
              {saving ? 'Saving…' : existing ? 'Save changes' : 'Create shop'}
            </button>
            {!existing && <p className="manage-shop__note">Your shop will be reviewed by an admin before it appears publicly.</p>}
          </form>
        </div>
      </main>
    </PageTransition>
  );
}
