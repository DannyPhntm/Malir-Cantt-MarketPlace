import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import PageTransition from '../components/PageTransition';
import listingsApi from '../services/listingsApi';
import { adaptListing } from '../services/listingAdapter';
import { computeListingStats } from '../lib/listingStats';
import { dur, ease } from '../animations';
import './ProfilePage.css';

// Downscale + compress an image File to a square-ish JPEG data-URL so avatars
// stay small enough to store inline (base64) in the user row.
function fileToAvatarDataUrl(file, max = 256, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}

// Business type slug → display label (mirrors backend BUSINESS_TYPES).
const BUSINESS_TYPE_LABELS = {
  'food-beverage': 'Food & Beverage', 'home-decor': 'Home Decor', furniture: 'Furniture',
  electronics: 'Electronics', automotive: 'Automotive', fashion: 'Fashion', fitness: 'Fitness',
  services: 'Services', education: 'Education', beauty: 'Beauty', health: 'Health',
  'real-estate': 'Real Estate', other: 'Other',
};

/* ── Icons ───────────────────────────────────────────────────────────────────── */

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}


function CameraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function EyeIcon({ off }) {
  return off ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

/* ── Email verified chip ─────────────────────────────────────────────────────── */

function EmailVerifiedChip({ verified }) {
  return (
    <span className={`prf-email-chip${verified ? ' prf-email-chip--ok' : ' prf-email-chip--no'}`}>
      {verified ? '✓ Email Verified' : '⚠ Unverified'}
    </span>
  );
}

/* ── Email change flow ───────────────────────────────────────────────────────── */
// Changing the account email requires verifying the NEW address: we send a
// 6-digit code there, then swap the email only once the code is confirmed.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EmailChangeFlow({ currentEmail }) {
  const { requestEmailChange, confirmEmailChange } = useAuth();
  const [open, setOpen]         = useState(false);
  const [step, setStep]         = useState('email'); // 'email' | 'code' | 'done'
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode]         = useState('');
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');

  const close = () => {
    setOpen(false);
    setStep('email');
    setNewEmail('');
    setCode('');
    setError('');
    setBusy(false);
  };

  const sendCode = async (e) => {
    e.preventDefault();
    const value = newEmail.trim().toLowerCase();
    if (!value)                 { setError('Enter your new email address.'); return; }
    if (!EMAIL_RE.test(value))  { setError('Enter a valid email address.'); return; }
    if (value === (currentEmail || '').toLowerCase()) {
      setError('That is already your email address.'); return;
    }
    setBusy(true); setError('');
    try {
      await requestEmailChange(value);
      setStep('code');
    } catch (err) {
      setError(err?.message || 'Could not send a code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code.'); return; }
    setBusy(true); setError('');
    try {
      await confirmEmailChange(newEmail.trim().toLowerCase(), code);
      setStep('done');
    } catch (err) {
      setError(err?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="prf-email-change">
        <button type="button" className="prf-email-change__toggle" onClick={() => setOpen(true)}>
          Change email address
        </button>
      </div>
    );
  }

  return (
    <div className="prf-email-change prf-email-change--open">
      <AnimatePresence mode="wait" initial={false}>
        {step === 'email' && (
          <motion.form
            key="ec-email"
            className="prf-email-change__panel"
            onSubmit={sendCode}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: ease.out }}
            noValidate
          >
            <p className="prf-email-change__heading">Change email address</p>
            <p className="prf-email-change__sub">
              We'll send a 6-digit code to the new address to confirm it's yours.
            </p>
            <input
              className={`prf-field__input${error ? ' prf-field__input--error' : ''}`}
              type="email" inputMode="email" autoComplete="email"
              placeholder="new@email.com"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); if (error) setError(''); }}
              autoFocus
            />
            {error && <p className="prf-field__error" role="alert">{error}</p>}
            <div className="prf-email-change__actions">
              <button type="submit" className="prf-save-btn" disabled={busy}>
                {busy ? 'Sending…' : 'Send Code'}
              </button>
              <button type="button" className="prf-cancel-btn" onClick={close} disabled={busy}>
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {step === 'code' && (
          <motion.form
            key="ec-code"
            className="prf-email-change__panel"
            onSubmit={confirm}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: ease.out }}
            noValidate
          >
            <p className="prf-email-change__heading">Enter verification code</p>
            <p className="prf-email-change__sub">
              We sent a 6-digit code to <strong>{newEmail.trim().toLowerCase()}</strong>.
            </p>
            <input
              className={`prf-field__input${error ? ' prf-field__input--error' : ''}`}
              type="text" inputMode="numeric" maxLength={6} autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); if (error) setError(''); }}
              autoFocus
            />
            {error && <p className="prf-field__error" role="alert">{error}</p>}
            <div className="prf-email-change__actions">
              <button type="submit" className="prf-save-btn" disabled={busy}>
                {busy ? 'Verifying…' : 'Verify & Update'}
              </button>
              <button type="button" className="prf-cancel-btn" onClick={() => { setStep('email'); setError(''); }} disabled={busy}>
                Back
              </button>
            </div>
          </motion.form>
        )}

        {step === 'done' && (
          <motion.div
            key="ec-done"
            className="prf-email-change__panel prf-email-change__panel--done"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: ease.out }}
          >
            <p className="prf-email-change__heading">
              <CheckCircleIcon /> Email updated
            </p>
            <p className="prf-email-change__sub">
              Your email is now <strong>{newEmail.trim().toLowerCase()}</strong> and verified.
            </p>
            <div className="prf-email-change__actions">
              <button type="button" className="prf-save-btn" onClick={close}>Done</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Form field ──────────────────────────────────────────────────────────────── */

function Field({
  label, name, value, onChange,
  type = 'text', placeholder, error,
  readOnly, optional, hint, className = '',
  labelAddon,
}) {
  return (
    <div className={`prf-field${className ? ' ' + className : ''}${error ? ' prf-field--error' : ''}`}>
      <div className="prf-field__label-row">
        <label className="prf-field__label" htmlFor={`prf-${name}`}>
          {label}
          {optional && <span className="prf-field__optional">Optional</span>}
        </label>
        {labelAddon}
      </div>
      <input
        id={`prf-${name}`}
        className={`prf-field__input${readOnly ? ' prf-field__input--readonly' : ''}${error ? ' prf-field__input--error' : ''}`}
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={readOnly ? '' : placeholder}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
        autoComplete={type === 'email' ? 'email' : undefined}
      />
      {hint && !error && <p className="prf-field__hint">{hint}</p>}
      {error && <p className="prf-field__error" role="alert">{error}</p>}
    </div>
  );
}

/* ── Section card ────────────────────────────────────────────────────────────── */

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`prf-card${className ? ' ' + className : ''}`}>
      {title && <h2 className="prf-card__title">{title}</h2>}
      {children}
    </div>
  );
}

/* ── Avatar editor ───────────────────────────────────────────────────────────── */
// The photo persists immediately on change/remove via updateProfile (its own
// save), independent of the Edit Profile form below.

function AvatarEditor({ name, avatar }) {
  const { updateProfile } = useAuth();
  const fileRef = useRef(null);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const initials = (name || 'U')
    .split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const pick = () => fileRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    setBusy(true); setError('');
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      await updateProfile({ avatar: dataUrl });
    } catch (err) {
      setError(err?.message || 'Could not update your photo. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true); setError('');
    try {
      await updateProfile({ avatar: null });
    } catch (err) {
      setError(err?.message || 'Could not remove your photo. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="prf-avatar-edit">
      <button
        type="button"
        className={`prf-avatar prf-avatar--editable${busy ? ' prf-avatar--busy' : ''}`}
        onClick={pick}
        disabled={busy}
        aria-label="Change profile photo"
      >
        {avatar
          ? <img className="prf-avatar__img" src={avatar} alt="" />
          : <span className="prf-avatar__initials">{initials}</span>}
        <span className="prf-avatar__overlay" aria-hidden="true"><CameraIcon /></span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      <div className="prf-avatar-actions">
        <button type="button" className="prf-avatar-link" onClick={pick} disabled={busy}>
          {busy ? 'Saving…' : avatar ? 'Change photo' : 'Add photo'}
        </button>
        {avatar && !busy && (
          <button type="button" className="prf-avatar-link prf-avatar-link--danger" onClick={remove}>
            Remove
          </button>
        )}
      </div>
      {error && <p className="prf-field__error" role="alert">{error}</p>}
    </div>
  );
}

/* ── Password input with show/hide ───────────────────────────────────────────── */

function PasswordInput({ name, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="prf-pw-wrap">
      <input
        className="prf-field__input"
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="prf-pw-toggle"
        onClick={() => setShow(v => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        <EyeIcon off={show} />
      </button>
    </div>
  );
}

/* ── Password change flow ────────────────────────────────────────────────────── */

function PasswordChangeSection() {
  const { changePassword } = useAuth();
  const [open, setOpen]   = useState(false);
  const [form, setForm]   = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');
  const [done, setDone]   = useState(false);

  const reset = () => {
    setForm({ current: '', next: '', confirm: '' });
    setError(''); setBusy(false); setDone(false);
  };
  const close = () => { reset(); setOpen(false); };

  const change = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.current)            { setError('Enter your current password.'); return; }
    if (form.next.length < 8)     { setError('New password must be at least 8 characters.'); return; }
    if (form.next !== form.confirm) { setError('New passwords do not match.'); return; }
    setBusy(true); setError('');
    try {
      await changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setDone(true);
    } catch (err) {
      setError(err?.message || 'Could not change your password. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="prf-email-change__toggle" onClick={() => setOpen(true)}>
        Change password
      </button>
    );
  }

  if (done) {
    return (
      <div className="prf-email-change prf-email-change--open">
        <div className="prf-email-change__panel prf-email-change__panel--done">
          <p className="prf-email-change__heading"><CheckCircleIcon /> Password updated</p>
          <p className="prf-email-change__sub">Your password has been changed.</p>
          <div className="prf-email-change__actions">
            <button type="button" className="prf-save-btn" onClick={close}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="prf-email-change prf-email-change--open" onSubmit={submit} noValidate>
      <div className="prf-email-change__panel">
        <p className="prf-email-change__heading">Change password</p>
        <p className="prf-email-change__sub">
          Enter your current password, then choose a new one (at least 8 characters).
        </p>
        <div className="prf-pw-fields">
          <PasswordInput
            name="current" value={form.current} onChange={change}
            placeholder="Current password" autoComplete="current-password"
          />
          <PasswordInput
            name="next" value={form.next} onChange={change}
            placeholder="New password" autoComplete="new-password"
          />
          <PasswordInput
            name="confirm" value={form.confirm} onChange={change}
            placeholder="Confirm new password" autoComplete="new-password"
          />
        </div>
        {error && <p className="prf-field__error" role="alert">{error}</p>}
        <div className="prf-email-change__actions">
          <button type="submit" className="prf-save-btn" disabled={busy}>
            {busy ? 'Updating…' : 'Update Password'}
          </button>
          <button type="button" className="prf-cancel-btn" onClick={close} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */

// Business fields default to empty if not in profile. Module-level so the
// reference is stable across renders (no need to list it as a hook dependency).
const BLANK_BUSINESS = { businessName: '', businessCategory: '', businessArea: '' };
// Active-featured cap per business (mirrors MAX_FEATURED_PER_BUSINESS on the server).
const FEATURED_CAP = 2;

export default function ProfilePage() {
  const { profile, updateProfile, userType, businessStatus, sellerStatus, applyForBusinessSeller } = useAuth();
  const [applyingSeller, setApplyingSeller] = useState(false);
  const [applyError, setApplyError] = useState('');
  const handleApplySeller = async () => {
    setApplyingSeller(true); setApplyError('');
    try { await applyForBusinessSeller(); }
    catch (e) { setApplyError(e?.message || 'Could not submit your application.'); }
    finally { setApplyingSeller(false); }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors,    setErrors]    = useState({});

  const [form, setForm] = useState({ ...BLANK_BUSINESS, ...profile });

  // Listing counts for the account summary (total + active).
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let active = true;
    listingsApi
      .mine()
      .then((res) => {
        if (active) setStats(computeListingStats((res.listings || []).map(adaptListing)));
      })
      .catch(() => { /* non-critical; counts simply stay hidden */ });
    return () => { active = false; };
  }, []);

  const handleEdit = useCallback(() => {
    setForm({ ...BLANK_BUSINESS, ...profile });
    setErrors({});
    setIsEditing(true);
  }, [profile]);

  const handleCancel = useCallback(() => {
    setForm({ ...BLANK_BUSINESS, ...profile });
    setErrors({});
    setIsEditing(false);
  }, [profile]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => prev[name] ? { ...prev, [name]: '' } : prev);
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name?.trim())  errs.name  = 'Name is required';
    if (!form.phone?.trim()) errs.phone = 'Phone number is required';
    if (!form.area?.trim())  errs.area  = 'Resident location is required';
    return errs;
  };

  // Persists name / phone / resident location (+ cantt pass) via the API.
  // Email + verification fields are read-only and never sent.
  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await updateProfile(form);
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError(e?.message || 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const ro = !isEditing; // readOnly shorthand

  return (
    <PageTransition>
      <main className="prf-page">

        {/* ── Dark header ────────────────────────────────────────────────── */}
        <header className="prf-header">
          <div className="prf-header__inner">
            <div>
              <nav className="prf-breadcrumb" aria-label="Breadcrumb">
                <Link to="/dashboard" className="prf-breadcrumb__link">Dashboard</Link>
                <span className="prf-breadcrumb__sep" aria-hidden="true">›</span>
                <span className="prf-breadcrumb__current">Profile</span>
              </nav>
              <h1 className="prf-header__title">My Profile</h1>
              <p className="prf-header__sub">Manage your account information</p>
            </div>
          </div>
        </header>

        <div className="prf-inner">

          {/* ── Success banner ──────────────────────────────────────────── */}
          <AnimatePresence>
            {saved && (
              <motion.div
                className="prf-success"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1,  y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: ease.out }}
              >
                <CheckCircleIcon />
                Profile updated successfully
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Profile summary card ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1,  y: 0 }}
            transition={{ duration: dur.slow, ease: ease.out }}
          >
            <SectionCard>
              <div className="prf-summary">
                <AvatarEditor name={profile.name} avatar={profile.avatar} />
                <div className="prf-summary__info">
                  <div className="prf-summary__name-row">
                    <span className="prf-summary__name">{profile.name}</span>
                    {profile.isVerified && (
                      <VerifiedBadge type={profile.badgeType} size="md" />
                    )}
                  </div>
                  {userType === 'business' && profile.businessName && (
                    <p className="prf-summary__biz">{profile.businessName}</p>
                  )}
                  <div className="prf-summary__meta">
                    <span className="prf-summary__type-pill">
                      {userType === 'business' ? 'Business' : 'Personal'}
                    </span>
                    {profile.area && (
                      <>
                        <span className="prf-meta-sep" aria-hidden="true">·</span>
                        <span className="prf-summary__detail">{profile.area}</span>
                      </>
                    )}
                    {profile.joinDate && (
                      <>
                        <span className="prf-meta-sep" aria-hidden="true">·</span>
                        <span className="prf-summary__detail">Joined {profile.joinDate}</span>
                      </>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <span className="prf-editing-pill">Editing</span>
                ) : (
                  <button className="prf-edit-btn" onClick={handleEdit} type="button">
                    <EditIcon />
                    Edit Profile
                  </button>
                )}
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Personal Information ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1,  y: 0 }}
            transition={{ duration: dur.slow, ease: ease.out, delay: 0.06 }}
          >
            <SectionCard
              title="Personal Information"
              className={isEditing ? 'prf-card--editing' : ''}
            >
              <div className="prf-fields-grid">
                <Field
                  label="Full Name" name="name"
                  value={form.name} onChange={handleChange}
                  placeholder="Your full name"
                  error={errors.name} readOnly={ro}
                />
                <Field
                  label="Email Address" name="email"
                  type="email" value={profile.email} onChange={handleChange}
                  placeholder="your@email.com"
                  readOnly
                  labelAddon={<EmailVerifiedChip verified={profile.emailVerified} />}
                />
                <div className="prf-field--full">
                  <EmailChangeFlow currentEmail={profile.email} />
                </div>
                <Field
                  label="Phone Number" name="phone"
                  type="tel" value={form.phone} onChange={handleChange}
                  placeholder="03XX-XXXXXXX"
                  readOnly={ro}
                />
                <Field
                  label="Area of Residence" name="area"
                  value={form.area} onChange={handleChange}
                  placeholder="e.g. Malir Cantt"
                  readOnly={ro}
                />
                <Field
                  label="Cantt Pass Number" name="canttPass"
                  value={form.canttPass} onChange={handleChange}
                  placeholder="e.g. CP-123456"
                  optional readOnly={ro}
                  className="prf-field--full"
                  hint="Your Cantt pass number unlocks the Verified Resident badge."
                />
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Security (password) ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1,  y: 0 }}
            transition={{ duration: dur.slow, ease: ease.out, delay: 0.08 }}
          >
            <SectionCard title="Security">
              <p className="prf-security__hint">
                Keep your account secure. Changing your password signs you out of nothing — you stay logged in here.
              </p>
              <PasswordChangeSection />
            </SectionCard>
          </motion.div>

          {/* ── Business Profile ─────────────────────────────────────────── */}
          {userType === 'business' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1,  y: 0 }}
              transition={{ duration: dur.slow, ease: ease.out, delay: 0.1 }}
            >
              <SectionCard
                title="Business Profile"
                className={isEditing ? 'prf-card--editing' : ''}
              >
                <div className="prf-fields-grid">
                  <Field
                    label="Business Name" name="businessName"
                    value={profile.businessName || ''} onChange={() => {}}
                    placeholder="Your business name"
                    readOnly className="prf-field--full"
                  />
                  <Field
                    label="Business Type" name="businessType"
                    value={BUSINESS_TYPE_LABELS[profile.businessType] || profile.businessType || '—'}
                    onChange={() => {}} readOnly
                  />
                </div>

                {/* Business Seller status + apply CTA */}
                <div className="prf-account-rows" style={{ marginTop: 'var(--space-4)' }}>
                  <div className="prf-account-row">
                    <span className="prf-account-label">Business Seller</span>
                    <span className={`prf-account-value prf-biz-status prf-biz-status--${sellerStatus}`}>
                      {sellerStatus === 'approved' ? 'Approved Seller'
                        : sellerStatus === 'pending' ? 'Pending approval'
                        : sellerStatus === 'rejected' ? 'Rejected' : 'Not applied'}
                    </span>
                  </div>
                  {(sellerStatus === 'not_applied' || sellerStatus === 'rejected') && (
                    <div className="prf-account-row">
                      <button type="button" className="prf-save-btn" onClick={handleApplySeller} disabled={applyingSeller}>
                        {applyingSeller ? 'Submitting…' : 'Apply for Business Seller'}
                      </button>
                    </div>
                  )}
                  {applyError && <p className="prf-field__error" role="alert">{applyError}</p>}
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ── Account Information (read-only) ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1,  y: 0 }}
            transition={{ duration: dur.slow, ease: ease.out, delay: userType === 'business' ? 0.14 : 0.1 }}
          >
            <SectionCard title="Account Information">
              <div className="prf-account-rows">
                <div className="prf-account-row">
                  <span className="prf-account-label">Account Type</span>
                  <span className="prf-account-type">
                    {userType === 'business' ? 'Business Account' : 'Personal Account'}
                  </span>
                </div>
                {userType === 'business' && (
                  <div className="prf-account-row">
                    <span className="prf-account-label">Business Status</span>
                    <span className={`prf-account-value prf-biz-status prf-biz-status--${businessStatus}`}>
                      {businessStatus === 'approved'
                        ? 'Approved'
                        : businessStatus === 'pending'
                          ? 'Pending approval'
                          : 'Not applied'}
                    </span>
                  </div>
                )}
                <div className="prf-account-row">
                  <span className="prf-account-label">Verification</span>
                  {profile.isVerified
                    ? <VerifiedBadge type={profile.badgeType} size="md" />
                    : <span className="prf-account-value prf-account-value--muted">Not verified</span>
                  }
                </div>
                <div className="prf-account-row">
                  <span className="prf-account-label">Email Status</span>
                  <EmailVerifiedChip verified={profile.emailVerified} />
                </div>
                {profile.joinDate && (
                  <div className="prf-account-row">
                    <span className="prf-account-label">Member Since</span>
                    <span className="prf-account-value">{profile.joinDate}</span>
                  </div>
                )}
                <div className="prf-account-row">
                  <span className="prf-account-label">Total Listings</span>
                  <span className="prf-account-value">{stats ? stats.total : '—'}</span>
                </div>
                <div className="prf-account-row">
                  <span className="prf-account-label">Active Listings</span>
                  <span className="prf-account-value">{stats ? stats.active : '—'}</span>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Business Access — upgrade/apply on the SAME account ───────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1,  y: 0 }}
            transition={{ duration: dur.slow, ease: ease.out, delay: 0.16 }}
          >
            <SectionCard title="Business Access">
              {businessStatus === 'approved' ? (
                <div className="prf-biz">
                  <div className="prf-biz__head">
                    <span className="prf-biz__label">Business Approved</span>
                    {profile.isVerified && <VerifiedBadge type={profile.badgeType || 'business'} size="md" />}
                  </div>
                  <p className="prf-biz__text">Your account can manage a shop profile and post business listings.</p>
                  <div className="prf-biz__stats">
                    <span>Featured slots: <strong>{stats ? stats.featured : '—'} of {FEATURED_CAP} used</strong></span>
                    <span>Active listings: <strong>{stats ? stats.active : '—'}</strong></span>
                  </div>
                  <div className="prf-biz__actions">
                    <Link to="/my-shop" className="prf-biz__btn">Manage Shop</Link>
                    <Link to="/add-listing" className="prf-biz__btn prf-biz__btn--ghost">Create Business Listing</Link>
                  </div>
                </div>
              ) : businessStatus === 'pending' ? (
                <div className="prf-biz">
                  <span className="prf-biz__label prf-biz__label--pending">Pending review</span>
                  <p className="prf-biz__text">
                    Your business application is under review. You'll be able to create a shop profile and
                    business listings once approved.
                  </p>
                </div>
              ) : businessStatus === 'rejected' ? (
                <div className="prf-biz">
                  <span className="prf-biz__label prf-biz__label--rejected">Not approved</span>
                  <p className="prf-biz__text">
                    Your business application was not approved. Contact support if you think this was a mistake.
                  </p>
                  <div className="prf-biz__actions">
                    <Link to="/apply-business" className="prf-biz__btn">Reapply for Business Account</Link>
                  </div>
                </div>
              ) : (
                <div className="prf-biz">
                  <p className="prf-biz__text">
                    Want to post as a shop or business? Apply for a business account to unlock business
                    listings, a shop profile, and verified business features — using this same account.
                  </p>
                  <div className="prf-biz__actions">
                    <Link to="/apply-business" className="prf-biz__btn">Apply for Business Account</Link>
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* ── Save / Cancel ────────────────────────────────────────────── */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                className="prf-actions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1,  y: 0 }}
                exit={{ opacity: 0,    y: 8 }}
                transition={{ duration: 0.18, ease: ease.out }}
              >
                {saveError && <p className="prf-save-error" role="alert">{saveError}</p>}
                <button className="prf-save-btn" type="button" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button className="prf-cancel-btn" type="button" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </PageTransition>
  );
}
