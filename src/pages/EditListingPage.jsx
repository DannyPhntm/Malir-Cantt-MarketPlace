import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useListings } from '../context/ListingsContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_CONFIG } from '../data/categoryConfig';
import CategoryFields from '../components/CategoryFields';
import PageTransition from '../components/PageTransition';
import LoadingState from '../components/LoadingState';
import listingsApi from '../services/listingsApi';
import './AddListingPage.css';
import './EditListingPage.css';

const CATEGORY_LABEL = {
  vehicles: 'Vehicles', technology: 'Technology', property: 'Property',
  furniture: 'Furniture', jobs: 'Jobs', services: 'Services',
  gym: 'Gym & Fitness', shoes: 'Shoes & Footwear', food: 'Food & Home Kitchen',
};

// Compress a picked file to a base64 JPEG (same approach as AddListingPage).
function compressImage(file, maxDim = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = ({ target: { result } }) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getListing, refresh } = useListings();
  const { user } = useAuth();

  const [phase, setPhase] = useState('loading'); // loading | unauthorized | notfound | ready | saved
  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState({ title: '', price: '', description: '' });
  const [categoryFields, setCategoryFields] = useState({});
  const [images, setImages] = useState([]); // array of url/base64 strings, in display order
  const [errors, setErrors] = useState({});
  const [catErrors, setCatErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // ── Load + ownership check ──
  useEffect(() => {
    let active = true;
    setPhase('loading');
    getListing(id)
      .then((l) => {
        if (!active) return;
        if (!l) { setPhase('notfound'); return; }
        const isOwner = user && (l.userId === user.id || user.role === 'admin');
        if (!isOwner) { setPhase('unauthorized'); return; }
        setOriginal(l);
        setForm({ title: l.title || '', price: String(l.priceRaw || ''), description: l.description || '' });
        setCategoryFields({ ...(l.details || {}) });
        setImages([...(l.images || [])].filter(Boolean));
        setPhase('ready');
      })
      .catch(() => { if (active) setPhase('notfound'); });
    return () => { active = false; };
  }, [id, getListing, user]);

  const catConfig = original ? CATEGORY_CONFIG[original.categorySlug] || null : null;
  const imageConfig = catConfig?.images || null;
  const maxImages = imageConfig?.max ?? 10;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCategoryFieldChange = (e) => {
    const { name, value } = e.target;
    setCategoryFields((prev) => ({ ...prev, [name]: value }));
    if (catErrors[name]) setCatErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageAdd = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) return;
    const room = maxImages - images.length;
    const compressed = await Promise.all(files.slice(0, room).map((f) => compressImage(f)));
    setImages((prev) => [...prev, ...compressed]);
    if (errors.images) setErrors((prev) => ({ ...prev, images: '' }));
  };

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  // Reorder by swapping with a neighbour (index 0 is the cover).
  const moveImage = (i, dir) => {
    setImages((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const validate = () => {
    const errs = {};
    const cErrs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!String(form.price).trim()) errs.price = `${catConfig?.priceLabel || 'Price'} is required`;
    if (!form.description.trim()) errs.description = 'Description is required';
    else if (form.description.trim().length < 10) errs.description = 'Description must be at least 10 characters';

    if (imageConfig?.required && images.length < (imageConfig.min || 1)) {
      errs.images = `Please keep at least ${imageConfig.min || 1} photo`;
    }
    catConfig?.fields.forEach((field) => {
      if (field.required && !categoryFields[field.name]) {
        cErrs[field.name] = `${field.label} is required`;
      }
    });
    return { errs, cErrs };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { errs, cErrs } = validate();
    if (Object.keys(errs).length || Object.keys(cErrs).length) {
      setErrors(errs);
      setCatErrors(cErrs);
      document.querySelector(`[name="${Object.keys(errs)[0] || Object.keys(cErrs)[0]}"]`)?.focus();
      return;
    }

    setSaving(true);
    setErrors((prev) => ({ ...prev, submit: '' }));
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(String(form.price).replace(/[^0-9]/g, '')),
        details: categoryFields,
        images: images.map((url, i) => ({ imageUrl: url, displayOrder: i })),
      };
      // Editing a rejected listing resubmits it for review.
      if (original.status === 'rejected') payload.status = 'pending';

      await listingsApi.update(id, payload);
      refresh?.();
      setPhase('saved');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Redirect back to My Listings shortly after confirming.
      setTimeout(() => navigate('/my-listings'), 1600);
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err?.message || 'Could not save your changes. Please try again.' }));
    } finally {
      setSaving(false);
    }
  };

  // ── Non-ready states ──
  if (phase === 'loading') {
    return (
      <PageTransition>
        <main className="edit-listing"><LoadingState label="Loading listing…" /></main>
      </PageTransition>
    );
  }

  if (phase === 'unauthorized' || phase === 'notfound') {
    const unauth = phase === 'unauthorized';
    return (
      <PageTransition>
        <main className="edit-listing">
          <div className="edit-listing__notice">
            <h1 className="edit-listing__notice-title">{unauth ? 'Unauthorized' : 'Listing not found'}</h1>
            <p className="edit-listing__notice-text">
              {unauth
                ? 'You can only edit your own listings.'
                : 'This listing may have been removed or the link is incorrect.'}
            </p>
            <Link to="/my-listings" className="edit-listing__notice-link">← Back to My Listings</Link>
          </div>
        </main>
      </PageTransition>
    );
  }

  if (phase === 'saved') {
    return (
      <PageTransition>
        <main className="add-listing">
          <div className="add-listing__content">
            <div className="add-listing__success">
              <div className="add-listing__success-card">
                <div className="add-listing__success-icon" aria-hidden="true">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="add-listing__success-heading">Changes saved</h2>
                <p className="add-listing__success-text">
                  Your listing <strong>“{form.title}”</strong> has been updated
                  {original.status === 'rejected' ? ' and resubmitted for review' : ''}. Redirecting to My Listings…
                </p>
                <div className="add-listing__success-actions">
                  <Link to={`/listing/${id}`} className="add-listing__success-home">View Listing</Link>
                  <Link to="/my-listings" className="add-listing__success-again">Back to My Listings</Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </PageTransition>
    );
  }

  // ── Edit form ──
  const priceLabel = catConfig?.priceLabel || 'Price';
  const titlePlaceholder = catConfig?.titlePlaceholder || 'e.g. What are you listing?';

  return (
    <PageTransition>
      <main className="add-listing edit-listing">

        {/* Header */}
        <div className="add-listing__hero">
          <div className="add-listing__hero-inner">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/my-listings" className="breadcrumb__link add-listing__breadcrumb-link">My Listings</Link>
              <span className="breadcrumb__sep add-listing__breadcrumb-sep" aria-hidden="true">/</span>
              <span className="breadcrumb__current add-listing__breadcrumb-current">Edit Listing</span>
            </nav>
            <h1 className="add-listing__hero-title">Edit Listing</h1>
            <p className="add-listing__hero-subtitle">Update your listing details, photos, and category info.</p>
          </div>
        </div>

        <div className="add-listing__content">
          <div className="edit-listing__form-wrap">
            <form className="add-listing__form" onSubmit={handleSubmit} noValidate>

              {/* Category — read-only on edit (changing it would change the whole field set) */}
              <div className="form-card">
                <h2 className="form-card__heading">Category</h2>
                <div className="form-group">
                  <div className="edit-listing__category-locked">
                    <span>{CATEGORY_LABEL[original.categorySlug] || original.categorySlug}</span>
                    <span className="edit-listing__category-lock-note">Category can't be changed after posting</span>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="form-card">
                <div className="form-card__header">
                  <h2 className="form-card__heading">Photos</h2>
                  <span className="form-card__badge">{images.length}/{maxImages}</span>
                </div>
                <p className="form-helper form-helper--spaced">
                  {imageConfig?.label || 'First photo is the cover shown on listings.'}
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple={maxImages > 1}
                  onChange={handleImageAdd}
                  className="form-upload__input"
                  aria-hidden="true"
                  tabIndex={-1}
                />

                {images.length === 0 ? (
                  <div
                    className={`form-upload${errors.images ? ' form-upload--error' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload listing photos"
                  >
                    <div className="form-upload__placeholder">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <p className="form-upload__text">
                        {imageConfig?.required ? 'Click to add photos' : 'Click to add photos (optional)'}
                      </p>
                      <p className="form-upload__hint">
                        {maxImages === 1 ? 'Up to 1 photo · JPG or PNG' : `Up to ${maxImages} photos · JPG or PNG`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="form-photo-grid">
                    {images.map((src, i) => (
                      <div key={i} className="form-photo-thumb">
                        <img src={src} alt={`Photo ${i + 1}`} />
                        {i === 0 && <span className="form-photo-cover">Cover</span>}
                        <div className="edit-photo-reorder">
                          <button type="button" className="edit-photo-move" disabled={i === 0}
                            onClick={() => moveImage(i, -1)} aria-label={`Move photo ${i + 1} earlier`}>‹</button>
                          <button type="button" className="edit-photo-move" disabled={i === images.length - 1}
                            onClick={() => moveImage(i, 1)} aria-label={`Move photo ${i + 1} later`}>›</button>
                        </div>
                        <button type="button" className="form-photo-remove" onClick={() => removeImage(i)} aria-label={`Remove photo ${i + 1}`}>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {images.length < maxImages && (
                      <button type="button" className="form-photo-add" onClick={() => fileInputRef.current?.click()} aria-label="Add more photos">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                )}
                {errors.images && <p className="form-error" role="alert">{errors.images}</p>}
              </div>

              {/* Category-specific fields */}
              <CategoryFields
                config={catConfig}
                values={categoryFields}
                errors={catErrors}
                onChange={handleCategoryFieldChange}
              />

              {/* Listing details */}
              <div className="form-card">
                <h2 className="form-card__heading">Listing Details</h2>

                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    Title <span className="form-required" aria-label="required">*</span>
                  </label>
                  <input id="title" name="title" type="text" value={form.title} onChange={handleChange}
                    placeholder={titlePlaceholder}
                    className={`form-input${errors.title ? ' form-input--error' : ''}`} maxLength={100} />
                  {errors.title && <p className="form-error" role="alert">{errors.title}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="price" className="form-label">
                    {priceLabel} <span className="form-required" aria-label="required">*</span>
                  </label>
                  <div className="form-price-wrap">
                    <span className="form-price-prefix" aria-hidden="true">Rs</span>
                    <input id="price" name="price" type="text" value={form.price} onChange={handleChange}
                      placeholder={catConfig?.pricePlaceholder || 'e.g. 50,000'}
                      className={`form-input form-input--price${errors.price ? ' form-input--error' : ''}`} inputMode="numeric" />
                  </div>
                  {errors.price && <p className="form-error" role="alert">{errors.price}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    Description <span className="form-required" aria-label="required">*</span>
                  </label>
                  <textarea id="description" name="description" value={form.description} onChange={handleChange}
                    placeholder="Describe your listing in detail — condition, features, what's included, etc."
                    className={`form-textarea${errors.description ? ' form-textarea--error' : ''}`} rows={5} maxLength={1000} />
                  <p className="form-helper">{form.description.length}/1000</p>
                  {errors.description && <p className="form-error" role="alert">{errors.description}</p>}
                </div>
              </div>

              {errors.submit && <p className="form-error" role="alert">{errors.submit}</p>}

              <div className="edit-listing__actions">
                <Link to="/my-listings" className="edit-listing__cancel">Cancel</Link>
                <motion.button type="submit" className="form-submit edit-listing__save" disabled={saving} whileTap={{ scale: 0.98 }}>
                  {saving ? <span className="form-submit__spinner" aria-label="Saving…" /> : 'Save Changes'}
                </motion.button>
              </div>

            </form>
          </div>
        </div>

      </main>
    </PageTransition>
  );
}
