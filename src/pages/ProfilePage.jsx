import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import PageTransition from '../components/PageTransition';
import { dur, ease } from '../animations';
import './ProfilePage.css';

const BUSINESS_CATEGORIES = [
  'Vehicles', 'Technology', 'Property', 'Furniture',
  'Jobs', 'Services', 'Gym & Fitness', 'Shoes & Footwear',
];

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

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9"/>
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

/* ── Select field ────────────────────────────────────────────────────────────── */

function SelectField({ label, name, value, onChange, options, readOnly }) {
  return (
    <div className="prf-field">
      <label className="prf-field__label" htmlFor={`prf-${name}`}>{label}</label>
      {readOnly ? (
        <div className="prf-field__input prf-field__input--readonly">
          {value || <span className="prf-field__empty">—</span>}
        </div>
      ) : (
        <div className="prf-field__select-wrap">
          <select
            id={`prf-${name}`}
            className="prf-field__select"
            name={name}
            value={value || ''}
            onChange={onChange}
          >
            <option value="">Select category</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <span className="prf-field__chevron"><ChevronIcon /></span>
        </div>
      )}
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

/* ── Page ────────────────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { profile, updateProfile, userType } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors,    setErrors]    = useState({});

  // Business fields default to empty if not in profile
  const blankBusiness = { businessName: '', businessCategory: '', businessArea: '' };
  const [form, setForm] = useState({ ...blankBusiness, ...profile });

  const initials = (profile.name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleEdit = useCallback(() => {
    setForm({ ...blankBusiness, ...profile });
    setErrors({});
    setIsEditing(true);
  }, [profile]);

  const handleCancel = useCallback(() => {
    setForm({ ...blankBusiness, ...profile });
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
                <div className="prf-avatar" aria-hidden="true">{initials}</div>
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
                    value={form.businessName} onChange={handleChange}
                    placeholder="Your business name"
                    readOnly={ro} className="prf-field--full"
                  />
                  <SelectField
                    label="Business Category" name="businessCategory"
                    value={form.businessCategory} onChange={handleChange}
                    options={BUSINESS_CATEGORIES} readOnly={ro}
                  />
                  <Field
                    label="Business Area" name="businessArea"
                    value={form.businessArea} onChange={handleChange}
                    placeholder="e.g. Malir Cantt"
                    readOnly={ro}
                  />
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
              </div>
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
