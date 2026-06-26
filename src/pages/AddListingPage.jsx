import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useListings } from '../context/ListingsContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_CONFIG } from '../data/categoryConfig';
import { LISTING_TIER } from '../data/premiumConfig';
import CategoryFields from '../components/CategoryFields';
import BusinessRequiredModal from '../components/BusinessRequiredModal';
import FeaturedListingOption from '../components/FeaturedListingOption';
import PageTransition from '../components/PageTransition';
import './AddListingPage.css';

// Category options derived from the taxonomy single source (no drift).
const CATEGORIES = [
  { value: '', label: 'Select a category' },
  ...Object.entries(CATEGORY_CONFIG).map(([slug, cfg]) => ({ value: slug, label: cfg.label })),
];

const INITIAL_FORM = {
  title: '',
  category: '',
  subcategory: '',
  postingType: 'personal',
  price: '',
  description: '',
  name: '',
  phone: '',
  location: 'Malir Cantt',
};

// Draft persistence — keeps the user's typed form across reloads/navigation
// until a listing is successfully submitted. Images aren't drafted (file/blob
// objects can't be serialised), so only the textual + selection state is saved.
const DRAFT_KEY = 'malir-listing-draft';

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY)) || null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

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

export default function AddListingPage() {
  const { addListing } = useListings();
  const { profile, isApprovedSeller, businessStatus } = useAuth();
  const navigate = useNavigate();

  // Restore any saved draft (captured once on mount).
  const draftRef = useRef(loadDraft());

  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    name:     profile?.name  || '',
    phone:    profile?.phone || '',
    location: profile?.area  || 'Malir Cantt',
    ...(draftRef.current?.form || {}),
  }));
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [listingTier, setListingTier] = useState(() => draftRef.current?.listingTier || LISTING_TIER.STANDARD);
  const [categoryFields, setCategoryFields] = useState(() => draftRef.current?.categoryFields || {});
  const [submitted, setSubmitted] = useState(null); // created listing after success
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [catErrors, setCatErrors] = useState({});
  const fileInputRef = useRef(null);

  const catConfig = CATEGORY_CONFIG[form.category] || null;
  const imageConfig = catConfig?.images || null;
  const maxImages = imageConfig?.max ?? 10;

  // Reset category-specific state whenever category changes — but skip the first
  // run so a restored draft's category fields aren't wiped on mount.
  const skipCategoryReset = useRef(true);
  useEffect(() => {
    if (skipCategoryReset.current) {
      skipCategoryReset.current = false;
      return;
    }
    if (!form.category) return;
    setCategoryFields({});
    setCatErrors({});
    setImageFiles([]);
    setImagePreviews([]);
    setErrors(prev => ({ ...prev, images: '' }));
  }, [form.category]);

  // Persist the draft (text + selections) whenever it changes, until submitted.
  useEffect(() => {
    if (submitted) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, categoryFields, listingTier }));
    } catch {
      /* ignore quota errors — images aren't stored, so this stays small */
    }
  }, [form, categoryFields, listingTier, submitted]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      // Commercial categories (Food, Services) are always business listings;
      // changing category resets the subcategory.
      const commercial = !!CATEGORY_CONFIG[value]?.businessOnly;
      setForm(prev => ({
        ...prev,
        category: value,
        subcategory: '',
        postingType: commercial ? 'business' : prev.postingType,
      }));
      if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // True when the chosen posting requires an approved seller the user lacks.
  const needsSeller = form.postingType === 'business' && !isApprovedSeller;

  // Send the user to the in-app business application (same account, no re-register).
  const goApplyBusiness = () => navigate('/apply-business');

  const handleCategoryFieldChange = (e) => {
    const { name, value } = e.target;
    setCategoryFields(prev => ({ ...prev, [name]: value }));
    if (catErrors[name]) setCatErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const toAdd = files.slice(0, maxImages - imageFiles.length);
    const newPreviews = toAdd.map(f => URL.createObjectURL(f));
    setImageFiles(prev => [...prev, ...toAdd]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    if (errors.images) setErrors(prev => ({ ...prev, images: '' }));
    e.target.value = '';
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    const cErrs = {};

    if (!form.title.trim())       errs.title       = 'Title is required';
    if (!form.price.trim())       errs.price       = `${catConfig?.priceLabel || 'Price'} is required`;
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.phone.trim())       errs.phone       = 'Contact number is required';

    if (imageConfig?.required && imageFiles.length < (imageConfig.min || 1)) {
      errs.images = `Please add at least ${imageConfig.min || 1} photo`;
    }

    catConfig?.fields.forEach(field => {
      if (field.required && !categoryFields[field.name]) {
        cErrs[field.name] = `${field.label} is required`;
      }
    });

    return { errs, cErrs };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Business listings require an approved Business Seller — surface the gate
    // instead of letting the backend reject it with a 403.
    if (needsSeller) {
      setShowServicesModal(true);
      return;
    }

    const { errs, cErrs } = validate();

    if (Object.keys(errs).length > 0 || Object.keys(cErrs).length > 0) {
      setErrors(errs);
      setCatErrors(cErrs);
      const firstKey = Object.keys(errs)[0] || Object.keys(cErrs)[0];
      document.querySelector(`[name="${firstKey}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const compressedImages = imageFiles.length > 0
        ? await Promise.all(imageFiles.map(compressImage))
        : [];

      const categoryLabel = CATEGORIES.find(c => c.value === form.category)?.label || '';
      const priceNum = Number(form.price.replace(/[^0-9]/g, ''));

      // Build meta array for detail page display
      const metaFields = catConfig
        ? catConfig.fields
            .filter(f => categoryFields[f.name])
            .map(f => ({ label: f.label, value: categoryFields[f.name] }))
        : [];

      const created = await addListing({
        title:        form.title.trim(),
        price:        `Rs ${priceNum.toLocaleString()}`,
        priceRaw:     priceNum,
        category:     categoryLabel,
        categorySlug: form.category,
        subcategory:  form.subcategory || null,
        postingType:  form.postingType,
        location:     form.location || 'Malir Cantt',
        condition:    categoryFields.condition || '',
        description:  form.description.trim(),
        image:        compressedImages[0] || '',
        images:       compressedImages.length > 0 ? compressedImages : undefined,
        meta:         metaFields,
        details:      categoryFields,
        // Featured is a request only — recorded as pending, never auto-activated.
        featuredRequested: listingTier === LISTING_TIER.FEATURED,
        seller: {
          name:        form.name.trim() || 'Anonymous',
          phone:       form.phone.trim(),
          memberSince: new Date().getFullYear().toString(),
          isVerified:  profile?.isVerified || false,
          badgeType:   profile?.badgeType  || 'resident',
        },
      });

      // Success — the listing is created (pending approval). Clear the draft and
      // show the confirmation screen instead of navigating away immediately.
      clearDraft();
      setSubmitted(created);
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to save listing:', err);
      setErrors(prev => ({ ...prev, submit: err?.message || 'Could not post your listing. Please try again.' }));
      setSubmitting(false);
    }
  };

  // "Post Another Listing" — reset everything for a fresh entry.
  const handlePostAnother = () => {
    setSubmitted(null);
    setForm({
      ...INITIAL_FORM,
      name:     profile?.name  || '',
      phone:    profile?.phone || '',
      location: profile?.area  || 'Malir Cantt',
    });
    setCategoryFields({});
    setCatErrors({});
    setErrors({});
    setImageFiles([]);
    setImagePreviews([]);
    setListingTier(LISTING_TIER.STANDARD);
  };

  const categoryLabel   = CATEGORIES.find(c => c.value === form.category)?.label || '';
  const priceLabel      = catConfig?.priceLabel      || 'Price';
  const titlePlaceholder = catConfig?.titlePlaceholder || 'e.g. What are you listing?';

  return (
    <PageTransition>
      <main className="add-listing">

        {/* ── Page header ── */}
        <div className="add-listing__hero">
          <div className="add-listing__hero-inner">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="breadcrumb__link add-listing__breadcrumb-link">Home</Link>
              <span className="breadcrumb__sep add-listing__breadcrumb-sep" aria-hidden="true">/</span>
              <span className="breadcrumb__current add-listing__breadcrumb-current">Post a Listing</span>
            </nav>
            <h1 className="add-listing__hero-title">Post a Listing</h1>
            <p className="add-listing__hero-subtitle">
              Reach thousands of buyers in Malir Cantt — for free.
            </p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="add-listing__content">
          {submitted ? (
            /* ── Success confirmation (listing pending approval) ── */
            <div className="add-listing__success">
              <div className="add-listing__success-card">
                <div className="add-listing__success-icon" aria-hidden="true">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="add-listing__success-heading">Listing submitted</h2>
                <p className="add-listing__success-text">
                  Your listing <strong>“{submitted.title}”</strong> is now <strong>pending approval</strong>.
                  We’ll review it shortly — once approved it appears across the marketplace.
                </p>
                <p className="add-listing__success-note">You can keep posting while it’s in review.</p>
                <div className="add-listing__success-actions">
                  <Link to={`/listing/${submitted.id}`} className="add-listing__success-home">
                    View Listing
                  </Link>
                  <button type="button" className="add-listing__success-again" onClick={handlePostAnother}>
                    Post Another
                  </button>
                </div>
              </div>
            </div>
          ) : (
          <div className="add-listing__content-inner">

            <section className="add-listing__form-section">
              <form className="add-listing__form" onSubmit={handleSubmit} noValidate>

                {/* ── Card 1: Category (always visible, drives everything) ── */}
                <div className="form-card">
                  <h2 className="form-card__heading">What are you listing?</h2>
                  <div className="form-group">
                    <label htmlFor="category" className="form-label">
                      Category <span className="form-required" aria-label="required">*</span>
                    </label>
                    <div className="form-select-wrap">
                      <select
                        id="category"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="form-select form-select--lg"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value} disabled={!c.value}>{c.label}</option>
                        ))}
                      </select>
                      <svg className="form-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {!form.category && (
                      <p className="form-helper catfields__prompt">Select a category to continue.</p>
                    )}
                  </div>

                  {/* Subcategory — shown once a category with subcategories is picked */}
                  {form.category && catConfig?.subcategories?.length > 0 && (
                    <div className="form-group">
                      <label htmlFor="subcategory" className="form-label">Subcategory</label>
                      <div className="form-select-wrap">
                        <select
                          id="subcategory"
                          name="subcategory"
                          value={form.subcategory}
                          onChange={handleChange}
                          className="form-select form-select--lg"
                        >
                          <option value="">Any / Not specified</option>
                          {catConfig.subcategories.map(s => (
                            <option key={s.slug} value={s.slug}>{s.label}</option>
                          ))}
                        </select>
                        <svg className="form-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Posting type — personal vs business (commercial categories lock to business) */}
                  {form.category && (
                    <div className="form-group">
                      <label className="form-label">Posting as</label>
                      {catConfig?.businessOnly ? (
                        <p className="form-helper">
                          This is a commercial category — your listing will be posted as a <strong>business listing</strong> and requires an approved Business Seller account.
                        </p>
                      ) : (
                        <div className="form-posting-type">
                          <label className="form-posting-type__opt">
                            <input type="radio" name="postingType" value="personal"
                              checked={form.postingType === 'personal'} onChange={handleChange} />
                            <span>Personal listing</span>
                          </label>
                          <label className="form-posting-type__opt">
                            <input type="radio" name="postingType" value="business"
                              checked={form.postingType === 'business'} onChange={handleChange} />
                            <span>Business listing</span>
                          </label>
                        </div>
                      )}
                      {needsSeller && (
                        businessStatus === 'pending' ? (
                          <p className="form-helper" role="status">
                            Your business application is under review. You can post a personal listing in the meantime.
                          </p>
                        ) : businessStatus === 'rejected' ? (
                          <p className="form-error" role="alert">
                            Your business application was not approved.{' '}
                            <Link to="/apply-business" className="form-inline-link">Reapply</Link> or contact support.
                          </p>
                        ) : (
                          <p className="form-error" role="alert">
                            Business listings need an approved business account.{' '}
                            <Link to="/apply-business" className="form-inline-link">Apply for a business account</Link>
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* ── Remaining cards — revealed after category is selected ── */}
                <AnimatePresence initial={false}>
                  {form.category && (
                    <motion.div
                      key="form-body"
                      className="catfields__body"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >

                      {/* ── Card 2: Photos (config-driven) ── */}
                      <div className="form-card">
                        <div className="form-card__header">
                          <h2 className="form-card__heading">Photos</h2>
                          <span className="form-card__badge">{imagePreviews.length}/{maxImages}</span>
                        </div>
                        <p className="form-helper form-helper--spaced">
                          {imageConfig?.label || 'First photo is the cover shown on listings.'}
                        </p>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple={maxImages > 1}
                          onChange={handleImageChange}
                          className="form-upload__input"
                          aria-hidden="true"
                          tabIndex={-1}
                        />

                        {imagePreviews.length === 0 ? (
                          <div
                            className={`form-upload${errors.images ? ' form-upload--error' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            aria-label="Upload listing photos"
                          >
                            <div className="form-upload__placeholder">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                                <rect x="3" y="3" width="18" height="18" rx="3"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="M21 15l-5-5L5 21"/>
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
                            {imagePreviews.map((src, i) => (
                              <div key={i} className="form-photo-thumb">
                                <img src={src} alt={`Photo ${i + 1}`} />
                                {i === 0 && <span className="form-photo-cover">Cover</span>}
                                <button
                                  type="button"
                                  className="form-photo-remove"
                                  onClick={() => removeImage(i)}
                                  aria-label={`Remove photo ${i + 1}`}
                                >
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="1" y1="1" x2="11" y2="11"/>
                                    <line x1="11" y1="1" x2="1" y2="11"/>
                                  </svg>
                                </button>
                              </div>
                            ))}
                            {imagePreviews.length < maxImages && (
                              <button
                                type="button"
                                className="form-photo-add"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Add more photos"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                  <line x1="12" y1="5" x2="12" y2="19"/>
                                  <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        )}
                        {errors.images && <p className="form-error" role="alert">{errors.images}</p>}
                      </div>

                      {/* ── Card 3: Category-specific fields (swaps on category change) ── */}
                      <AnimatePresence mode="wait">
                        <CategoryFields
                          key={form.category}
                          config={catConfig}
                          values={categoryFields}
                          errors={catErrors}
                          onChange={handleCategoryFieldChange}
                        />
                      </AnimatePresence>

                      {/* ── Card 4: Listing Details ── */}
                      <div className="form-card">
                        <h2 className="form-card__heading">Listing Details</h2>

                        <div className="form-group">
                          <label htmlFor="title" className="form-label">
                            Title <span className="form-required" aria-label="required">*</span>
                          </label>
                          <input
                            id="title"
                            name="title"
                            type="text"
                            value={form.title}
                            onChange={handleChange}
                            placeholder={titlePlaceholder}
                            className={`form-input${errors.title ? ' form-input--error' : ''}`}
                            maxLength={100}
                          />
                          {errors.title && <p className="form-error" role="alert">{errors.title}</p>}
                        </div>

                        <div className="form-group">
                          <label htmlFor="price" className="form-label">
                            {priceLabel} <span className="form-required" aria-label="required">*</span>
                          </label>
                          <div className="form-price-wrap">
                            <span className="form-price-prefix" aria-hidden="true">Rs</span>
                            <input
                              id="price"
                              name="price"
                              type="text"
                              value={form.price}
                              onChange={handleChange}
                              placeholder={catConfig?.pricePlaceholder || 'e.g. 50,000'}
                              className={`form-input form-input--price${errors.price ? ' form-input--error' : ''}`}
                              inputMode="numeric"
                            />
                          </div>
                          {errors.price && <p className="form-error" role="alert">{errors.price}</p>}
                        </div>

                        <div className="form-group">
                          <label htmlFor="description" className="form-label">
                            Description <span className="form-required" aria-label="required">*</span>
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe your listing in detail — condition, features, what's included, etc."
                            className={`form-textarea${errors.description ? ' form-textarea--error' : ''}`}
                            rows={5}
                            maxLength={1000}
                          />
                          <p className="form-helper">{form.description.length}/1000</p>
                          {errors.description && <p className="form-error" role="alert">{errors.description}</p>}
                        </div>
                      </div>

                      {/* ── Card 5: Contact ── */}
                      <div className="form-card">
                        <h2 className="form-card__heading">Contact</h2>

                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="name" className="form-label">Your Name</label>
                            <input
                              id="name"
                              name="name"
                              type="text"
                              value={form.name}
                              onChange={handleChange}
                              placeholder="e.g. Ahmed Khan"
                              className="form-input"
                              maxLength={60}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="phone" className="form-label">
                              Contact Number <span className="form-required" aria-label="required">*</span>
                            </label>
                            <input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={form.phone}
                              onChange={handleChange}
                              placeholder="03XX-XXXXXXX"
                              className={`form-input${errors.phone ? ' form-input--error' : ''}`}
                              autoComplete="tel"
                            />
                            {errors.phone && <p className="form-error" role="alert">{errors.phone}</p>}
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="location" className="form-label">Location</label>
                          <input
                            id="location"
                            name="location"
                            type="text"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="e.g. Malir Cantt, Sector B"
                            className="form-input"
                          />
                        </div>

                        {profile && (
                          <p className="form-profile-hint">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M12 8v4M12 16h.01"/>
                            </svg>
                            Information imported from your profile.
                          </p>
                        )}
                      </div>

                      {/* ── Card 6: Listing Visibility (Standard / Featured) ── */}
                      <FeaturedListingOption
                        value={listingTier}
                        onChange={setListingTier}
                      />

                      {/* ── Submit ── */}
                      {errors.submit && (
                        <p className="form-error" role="alert">{errors.submit}</p>
                      )}
                      <motion.button
                        type="submit"
                        className="form-submit"
                        disabled={submitting}
                        whileTap={{ scale: 0.98 }}
                      >
                        {submitting ? (
                          <span className="form-submit__spinner" aria-label="Publishing…" />
                        ) : (
                          'Publish Listing'
                        )}
                      </motion.button>

                      <p className="form-terms">
                        By posting, you agree to our{' '}
                        <Link to="/" className="form-terms__link">Terms of Service</Link>{' '}
                        and{' '}
                        <Link to="/" className="form-terms__link">Community Guidelines</Link>.
                      </p>

                    </motion.div>
                  )}
                </AnimatePresence>

              </form>
            </section>

            {/* ── Live Preview ── */}
            <aside className="add-listing__preview-section" aria-label="Listing preview">
              <div className="add-listing__preview-sticky">
                <p className="add-listing__preview-label">Preview</p>
                <div className="add-listing__preview-card">
                  <div className="add-listing__preview-image-wrap">
                    {imagePreviews[0] ? (
                      <img src={imagePreviews[0]} alt="" className="add-listing__preview-image" />
                    ) : (
                      <div className="add-listing__preview-image-placeholder" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                          <rect x="3" y="3" width="18" height="18" rx="3"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                      </div>
                    )}
                    {imagePreviews.length > 1 && (
                      <span className="add-listing__preview-photo-count">
                        {imagePreviews.length} photos
                      </span>
                    )}
                  </div>
                  <div className="add-listing__preview-body">
                    <p className="add-listing__preview-price">
                      {form.price ? `Rs ${form.price}` : priceLabel || 'Price'}
                    </p>
                    <p className="add-listing__preview-title">
                      {form.title || 'Your listing title will appear here'}
                    </p>
                    <div className="add-listing__preview-meta">
                      <span className="add-listing__preview-category">
                        {categoryLabel || 'Category'}
                      </span>
                      <span className="add-listing__preview-dot" aria-hidden="true" />
                      <span className="add-listing__preview-location">Malir Cantt</span>
                    </div>
                    <p className="add-listing__preview-time">Just now</p>
                  </div>
                </div>
                <p className="add-listing__preview-note">
                  This is how your listing will appear to buyers.
                </p>
              </div>
            </aside>

          </div>
          )}
        </div>

      </main>

      {/* Business Seller gate modal */}
      <AnimatePresence>
        {showServicesModal && (
          <BusinessRequiredModal
            title="Business account required"
            message="This category is for businesses. Apply for a business account using your existing login to post commercial listings."
            primaryLabel="Apply for a business account"
            onPrimary={goApplyBusiness}
            secondaryLabel="Back"
            onDismiss={() => {
              setShowServicesModal(false);
              // Commercial categories can't be posted personally — clear the
              // category; otherwise just revert to a personal listing.
              setForm(prev =>
                CATEGORY_CONFIG[prev.category]?.businessOnly
                  ? { ...prev, category: '' }
                  : { ...prev, postingType: 'personal' });
            }}
          />
        )}
      </AnimatePresence>

    </PageTransition>
  );
}
