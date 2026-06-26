import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import BusinessBenefitsCard from '../components/BusinessBenefitsCard';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const TAB_VARIANTS = {
  initial: { opacity: 0, x: 12 },
  enter:   { opacity: 1, x: 0,  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -12, transition: { duration: 0.14 } },
};

const STEP_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  enter:   { opacity: 1, y: 0,  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

// Business types (what kind of business they operate) — value is the backend
// slug, label is shown. Mirrors BUSINESS_TYPES in the server constants.
const BUSINESS_TYPE_OPTIONS = [
  { value: 'food-beverage', label: 'Food & Beverage' },
  { value: 'home-decor',    label: 'Home Decor' },
  { value: 'furniture',     label: 'Furniture' },
  { value: 'electronics',   label: 'Electronics' },
  { value: 'automotive',    label: 'Automotive' },
  { value: 'fashion',       label: 'Fashion' },
  { value: 'fitness',       label: 'Fitness' },
  { value: 'services',      label: 'Services' },
  { value: 'education',     label: 'Education' },
  { value: 'beauty',        label: 'Beauty' },
  { value: 'health',        label: 'Health' },
  { value: 'real-estate',   label: 'Real Estate' },
  { value: 'other',         label: 'Other' },
];

const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_S   = 60;

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Translate an ApiError's per-field validation map (server field names) into the
// form's field names. Returns { fieldErrors, general } so handlers can show inline
// errors where possible and a friendly banner for anything else.
function mapApiError(err, fieldMap = {}) {
  const fieldErrors = {};
  let general = err?.message || 'Something went wrong. Please try again.';
  if (err?.fields && typeof err.fields === 'object') {
    let mappedAny = false;
    for (const [apiKey, message] of Object.entries(err.fields)) {
      const formKey = fieldMap[apiKey] || apiKey;
      fieldErrors[formKey] = message;
      mappedAny = true;
    }
    if (mappedAny) general = '';
  }
  return { fieldErrors, general };
}

/* ── Icon components ─────────────────────────────────────────────────────────── */

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="form-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

/* ── Password field ──────────────────────────────────────────────────────────── */

function PasswordField({ id, label, name, value, onChange, placeholder = 'Min. 8 characters', error, inputRef }) {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className="login-pw-wrap">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`form-input login-pw-input${error ? ' form-input--error' : ''}`}
          autoComplete="new-password"
          minLength={8}
        />
        <button
          type="button"
          className="login-pw-toggle"
          onClick={() => setShow(v => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

/* ── Email verification screen ───────────────────────────────────────────────── */

function EmailVerificationScreen({ email, notice, onVerify, onSuccess, onResend, onBack }) {
  const [input, setInput]               = useState('');
  const [error, setError]               = useState('');
  const [attempts, setAttempts]         = useState(0);
  const [verifying, setVerifying]       = useState(false);
  const [countdown, setCountdown]       = useState(RESEND_COOLDOWN_S);
  const [resendStatus, setResendStatus] = useState(''); // '' | 'sending' | 'sent'
  const inputRef = useRef(null);

  // Focus the code input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Resend cooldown ticker
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const locked = attempts >= MAX_VERIFY_ATTEMPTS;

  const handleVerify = async e => {
    e.preventDefault();
    if (!input.trim()) { setError('Please enter the 6-digit code.'); return; }

    setVerifying(true);
    try {
      await onVerify(input.trim());
      setVerifying(false);
      onSuccess();
    } catch (err) {
      setVerifying(false);
      const next = attempts + 1;
      setAttempts(next);
      setInput('');
      inputRef.current?.focus();
      if (next >= MAX_VERIFY_ATTEMPTS) {
        setError('Too many incorrect attempts. Request a new code to continue.');
      } else {
        // Prefer the server's message; fall back to a generic one.
        setError(err?.message || 'Incorrect code. Please try again.');
      }
    }
  };

  const handleResend = async () => {
    setResendStatus('sending');
    setError('');
    setAttempts(0);
    setInput('');
    try {
      await onResend();
      setResendStatus('sent');
      setCountdown(RESEND_COOLDOWN_S);
      inputRef.current?.focus();
      setTimeout(() => setResendStatus(''), 3000);
    } catch (err) {
      setResendStatus('');
      setError(err?.message || 'Could not resend the code. Please try again.');
    }
  };

  return (
    <div className="verify-screen">
      <button type="button" className="verify-back-btn" onClick={onBack}>
        ← Wrong email? Go back
      </button>

      <div className="verify-icon-wrap">
        <div className="verify-icon">
          <MailIcon />
        </div>
      </div>

      <p className="verify-heading">Check your email</p>
      {notice && <p className="verify-notice" role="status">{notice}</p>}
      <p className="verify-subtext">
        We sent a 6-digit code to{' '}
        <span className="verify-email">{email}</span>
      </p>

      <form className="verify-form" onSubmit={handleVerify} noValidate>
        <div className="verify-code-wrap">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={input}
            onChange={e => {
              setInput(e.target.value.replace(/\D/g, ''));
              if (error) setError('');
            }}
            placeholder="000000"
            className={`verify-code-input${error ? ' verify-code-input--error' : ''}`}
            autoComplete="one-time-code"
            disabled={locked || verifying}
            aria-label="Verification code"
          />
          {error && <p className="verify-code-error" role="alert">{error}</p>}
        </div>

        <button
          type="submit"
          className="login-submit"
          disabled={verifying || locked}
        >
          {verifying ? 'Verifying…' : 'Verify Email'}
        </button>

        <div className="verify-resend-row">
          {resendStatus === 'sent' ? (
            <span className="verify-resend-sent">Code resent — check your inbox.</span>
          ) : (
            <>
              <span>Didn't receive it?</span>
              <button
                type="button"
                className="verify-resend-btn"
                onClick={handleResend}
                disabled={countdown > 0 || resendStatus === 'sending'}
              >
                {resendStatus === 'sending'
                  ? 'Sending…'
                  : countdown > 0
                    ? `Resend in ${countdown}s`
                    : 'Resend code'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

/* ── Business application — pending approval state ────────────────────────────── */

function BusinessPendingSuccess() {
  return (
    <div className="verified-success">
      <div className="verified-success__icon">
        <CheckIcon />
      </div>
      <p className="verified-success__title">Application submitted!</p>
      <span className="biz-pending-badge">
        <ShieldIcon /> Pending Approval
      </span>
      <p className="verified-success__text">
        Your business account is under review. Once approved, you'll automatically receive your{' '}
        <strong>Verified Business</strong> badge and be able to list Services.
      </p>
    </div>
  );
}

/* ── Reset password form ─────────────────────────────────────────────────────── */

function ResetPasswordForm({ onSubmit, onSuccess }) {
  const [form, setForm]   = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const firstFieldRef = useRef(null);

  useEffect(() => { firstFieldRef.current?.focus(); }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.password)                  errs.password        = 'Password is required.';
    else if (form.password.length < 8)   errs.password        = 'Password must be at least 8 characters.';
    if (!form.confirmPassword)           errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await onSubmit(form.password);
      setSaving(false);
      onSuccess();
    } catch (err) {
      setSaving(false);
      setErrors({ _general: err?.message || 'Could not reset your password. Please try again.' });
    }
  };

  return (
    <div>
      <div className="verify-icon-wrap">
        <div className="verify-icon">
          <LockIcon />
        </div>
      </div>
      <p className="verify-heading">Create new password</p>
      <p className="verify-subtext">Choose a strong password with at least 8 characters.</p>
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="fp-new-password" name="password" label="New Password *"
          value={form.password} onChange={handleChange}
          error={errors.password}
          inputRef={firstFieldRef}
        />
        <PasswordField
          id="fp-confirm-password" name="confirmPassword" label="Confirm New Password *"
          value={form.confirmPassword} onChange={handleChange}
          placeholder="Re-enter your new password"
          error={errors.confirmPassword}
        />
        {errors._general && <p className="form-error" role="alert">{errors._general}</p>}
        <button type="submit" className="login-submit" disabled={saving}>
          {saving ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

/* ── Password reset success ───────────────────────────────────────────────────── */

function PasswordResetSuccess({ onSignIn }) {
  return (
    <div className="verified-success">
      <div className="verified-success__icon">
        <CheckIcon />
      </div>
      <p className="verified-success__title">Password reset!</p>
      <p className="verified-success__text">
        Your password has been updated. You can now sign in with your new credentials.
      </p>
      <button type="button" className="login-submit" onClick={onSignIn}>
        Back to Sign In
      </button>
    </div>
  );
}

/* ── Forgot password flow ────────────────────────────────────────────────────── */

function ForgotPasswordFlow({ onBack }) {
  const { requestPasswordReset, resetPassword } = useAuth();
  const [stage, setStage]             = useState('email'); // 'email' | 'verify' | 'reset' | 'done'
  const [email, setEmail]             = useState('');
  const [emailError, setEmailError]   = useState('');
  const [sending, setSending]         = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const emailInputRef = useRef(null);

  useEffect(() => { emailInputRef.current?.focus(); }, []);

  const handleSendCode = async e => {
    e.preventDefault();
    if (!email.trim())        { setEmailError('Email address is required.'); return; }
    if (!validateEmail(email)) { setEmailError('Enter a valid email address.'); return; }

    setSending(true);
    try {
      await requestPasswordReset(email.trim());
      setSending(false);
      setStage('verify');
    } catch (err) {
      setSending(false);
      setEmailError(err?.message || 'Could not send a reset code. Please try again.');
    }
  };

  const handleResend = async () => {
    await requestPasswordReset(email.trim());
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {stage === 'email' && (
        <motion.div key="fp-email" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <button type="button" className="verify-back-btn" onClick={onBack}>
            ← Back to Sign In
          </button>
          <div className="verify-icon-wrap">
            <div className="verify-icon">
              <LockIcon />
            </div>
          </div>
          <p className="verify-heading">Forgot your password?</p>
          <p className="verify-subtext">
            Enter your email and we'll send a 6-digit code to reset your password.
          </p>
          <form className="login-form" onSubmit={handleSendCode} noValidate>
            <div className="form-group">
              <label htmlFor="fp-email" className="form-label">Email Address</label>
              <input
                ref={emailInputRef}
                id="fp-email" name="email" type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                placeholder="you@example.com"
                className={`form-input${emailError ? ' form-input--error' : ''}`}
                autoComplete="email"
              />
              {emailError && <p className="form-error" role="alert">{emailError}</p>}
            </div>
            <button type="submit" className="login-submit" disabled={sending}>
              {sending ? 'Sending code…' : 'Send Reset Code'}
            </button>
          </form>
        </motion.div>
      )}

      {stage === 'verify' && (
        <motion.div key="fp-verify" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <EmailVerificationScreen
            email={email}
            // The reset code is validated together with the new password at the
            // final step, so here we just capture it and advance.
            onVerify={(code) => { setEnteredCode(code); return Promise.resolve(); }}
            onSuccess={() => setStage('reset')}
            onResend={handleResend}
            onBack={() => setStage('email')}
          />
        </motion.div>
      )}

      {stage === 'reset' && (
        <motion.div key="fp-reset" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <ResetPasswordForm
            onSubmit={(password) => resetPassword(email.trim(), enteredCode, password)}
            onSuccess={() => setStage('done')}
          />
        </motion.div>
      )}

      {stage === 'done' && (
        <motion.div key="fp-done" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <PasswordResetSuccess onSignIn={onBack} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Account type picker ─────────────────────────────────────────────────────── */

function AccountTypePicker({ onSelect }) {
  return (
    <div className="reg-type-section">
      <p className="reg-type-heading">Choose your account type</p>
      <div className="acct-type-grid">
        <button type="button" className="acct-type-card" onClick={() => onSelect('personal')}>
          <div className="acct-type-card__icon">
            <PersonIcon />
          </div>
          <p className="acct-type-card__title">Personal</p>
          <p className="acct-type-card__desc">For Malir Cantt residents buying and selling</p>
        </button>
        <button type="button" className="acct-type-card" onClick={() => onSelect('business')}>
          <div className="acct-type-card__icon">
            <BuildingIcon />
          </div>
          <p className="acct-type-card__title">Business</p>
          <p className="acct-type-card__desc">For local shops, services, and businesses</p>
        </button>
      </div>
    </div>
  );
}

/* ── Personal account form ───────────────────────────────────────────────────── */

function PersonalForm({ onBack, onAuthenticated }) {
  const { register, verifyEmail, resendVerification } = useAuth();
  const [stage, setStage]           = useState('form'); // 'form' | 'verify'
  const [form, setForm]             = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', area: '', canttPass: '',
  });
  const [errors, setErrors]         = useState({});
  const [sending, setSending]       = useState(false);
  const [verifyNotice, setVerifyNotice] = useState('');
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.fullName.trim())           errs.fullName        = 'Full name is required.';
    if (!form.email.trim())              errs.email           = 'Email address is required.';
    else if (!validateEmail(form.email)) errs.email           = 'Enter a valid email address.';
    if (!form.phone.trim())              errs.phone           = 'Phone number is required.';
    if (!form.password)                  errs.password        = 'Password is required.';
    else if (form.password.length < 8)   errs.password        = 'Password must be at least 8 characters.';
    if (!form.confirmPassword)           errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!form.area.trim())               errs.area            = 'Area of residence is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSending(true);
    try {
      await register({
        name: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        accountType: 'personal',
        residentLocation: form.area,
        canttPassNumber: form.canttPass || null,
      });      setSending(false);
      setVerifyNotice('');
      setStage('verify');
    } catch (err) {
      setSending(false);
      // Existing-but-unverified account: send the user to the verify screen so
      // they can resend the code rather than hitting a dead-end "already exists".
      if (err?.unverified) {
        setVerifyNotice('Account exists but is not verified. Resend verification email?');
        setStage('verify');
        return;
      }
      const { fieldErrors, general } = mapApiError(err, {
        name: 'fullName', residentLocation: 'area', canttPassNumber: 'canttPass',
      });
      setErrors({ ...fieldErrors, _general: general });
    }
  };

  const handleResend = async () => {
    await resendVerification(form.email);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {stage === 'form' && (
        <motion.div key="form" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <button type="button" className="reg-back-btn" onClick={onBack}>
            ← Change account type
          </button>
          <span className="reg-type-badge"><PersonIcon /> Personal Account</span>
          <form className="login-form" onSubmit={handleSubmit} noValidate>

            <div className="form-group">
              <label htmlFor="p-fullname" className="form-label">
                Full Name <span className="form-required">*</span>
              </label>
              <input
                id="p-fullname" name="fullName" type="text"
                value={form.fullName} onChange={handleChange}
                placeholder="e.g. Ahmed Khan"
                className={`form-input${errors.fullName ? ' form-input--error' : ''}`}
                autoComplete="name"
              />
              {errors.fullName && <p className="form-error" role="alert">{errors.fullName}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="p-email" className="form-label">
                Email Address <span className="form-required">*</span>
              </label>
              <input
                id="p-email" name="email" type="email"
                value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                className={`form-input${errors.email ? ' form-input--error' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="form-error" role="alert">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="p-phone" className="form-label">
                Phone Number <span className="form-required">*</span>
              </label>
              <input
                id="p-phone" name="phone" type="tel"
                value={form.phone} onChange={handleChange}
                placeholder="03XX-XXXXXXX"
                className={`form-input${errors.phone ? ' form-input--error' : ''}`}
                autoComplete="tel"
              />
              {errors.phone && <p className="form-error" role="alert">{errors.phone}</p>}
            </div>

            <PasswordField
              id="p-password" name="password" label="Password *"
              value={form.password} onChange={handleChange}
              error={errors.password}
            />

            <PasswordField
              id="p-confirm-password" name="confirmPassword" label="Confirm Password *"
              value={form.confirmPassword} onChange={handleChange}
              placeholder="Re-enter your password"
              error={errors.confirmPassword}
            />

            <div className="form-group">
              <label htmlFor="p-area" className="form-label">
                Area of Residence <span className="form-required">*</span>
              </label>
              <input
                id="p-area" name="area" type="text"
                value={form.area} onChange={handleChange}
                placeholder="e.g. Malir Cantt, Sector B"
                className={`form-input${errors.area ? ' form-input--error' : ''}`}
              />
              {errors.area && <p className="form-error" role="alert">{errors.area}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="p-canttpass" className="form-label">
                Cantt Pass Number
                <span className="login-optional"> (optional)</span>
              </label>
              <input
                id="p-canttpass" name="canttPass" type="text"
                value={form.canttPass} onChange={handleChange}
                placeholder="e.g. MC-12345"
                className="form-input"
              />
              <div className="cantt-verify-hint">
                <ShieldIcon />
                <p>Verify your Malir Cantt residency for additional trust and future platform benefits.</p>
              </div>
            </div>

            {errors._general && <p className="form-error" role="alert">{errors._general}</p>}
            <button type="submit" className="login-submit" disabled={sending}>
              {sending ? 'Creating account…' : 'Create Personal Account'}
            </button>
            <p className="login-terms">
              By creating an account you agree to our{' '}
              <Link to="/" className="login-terms__link">Terms of Service</Link>.
            </p>
          </form>
        </motion.div>
      )}

      {stage === 'verify' && (
        <motion.div key="verify" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <EmailVerificationScreen
            email={form.email}            onVerify={(code) => verifyEmail(form.email, code)}
            notice={verifyNotice}
            onSuccess={onAuthenticated}
            onResend={handleResend}
            onBack={() => setStage('form')}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Business account form ───────────────────────────────────────────────────── */

function BusinessForm({ onBack, onSwitchToSignIn }) {
  const { register, verifyEmail, resendVerification } = useAuth();
  const [stage, setStage]             = useState('form'); // 'form' | 'verify' | 'done'
  const [existingEmail, setExistingEmail] = useState(false);
  const [form, setForm]               = useState({
    businessName: '', ownerName: '', email: '', phone: '',
    password: '', confirmPassword: '', category: '', area: '', verification: '',
  });
  const [errors, setErrors]           = useState({});
  const [sending, setSending]         = useState(false);
  const [verifyNotice, setVerifyNotice] = useState('');
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.businessName.trim())       errs.businessName    = 'Business name is required.';
    if (!form.ownerName.trim())          errs.ownerName       = 'Owner name is required.';
    if (!form.email.trim())              errs.email           = 'Email address is required.';
    else if (!validateEmail(form.email)) errs.email           = 'Enter a valid email address.';
    if (!form.phone.trim())              errs.phone           = 'Phone number is required.';
    if (!form.password)                  errs.password        = 'Password is required.';
    else if (form.password.length < 8)   errs.password        = 'Password must be at least 8 characters.';
    if (!form.confirmPassword)           errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!form.category)                  errs.category        = 'Business type is required.';
    if (!form.area.trim())               errs.area            = 'Business area is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSending(true);
    try {
      await register({
        name: form.ownerName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        accountType: 'business',
        residentLocation: form.area,
        businessName: form.businessName,
        businessType: form.category || undefined,
      });      setSending(false);
      setVerifyNotice('');
      setStage('verify');
    } catch (err) {
      setSending(false);
      // Existing-but-unverified account: route to the verify screen to resend.
      if (err?.unverified) {
        setVerifyNotice('Account exists but is not verified. Resend verification email?');
        setStage('verify');
        return;
      }
      // Existing (verified) account: this isn't a dead-end — they can log in and
      // apply for business access on the same account.
      if (err?.status === 409) {
        setExistingEmail(true);
        return;
      }
      const { fieldErrors, general } = mapApiError(err, {
        name: 'ownerName', residentLocation: 'area',
      });
      setErrors({ ...fieldErrors, _general: general });
    }
  };

  const handleResend = async () => {
    await resendVerification(form.email);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {stage === 'form' && existingEmail && (
        <motion.div key="exists" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <button type="button" className="reg-back-btn" onClick={() => setExistingEmail(false)}>
            ← Back
          </button>
          <span className="reg-type-badge"><BuildingIcon /> Business Account</span>
          <div className="reg-exists-notice">
            <p className="reg-exists-notice__title">This email already has an account</p>
            <p className="reg-exists-notice__text">
              An account with this email already exists. Log in to apply for business access using your
              existing account — you don't need a second account.
            </p>
          </div>
          <button type="button" className="login-submit" onClick={onSwitchToSignIn}>
            Log in and apply for business access
          </button>
        </motion.div>
      )}

      {stage === 'form' && !existingEmail && (
        <motion.div key="form" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <button type="button" className="reg-back-btn" onClick={onBack}>
            ← Change account type
          </button>
          <span className="reg-type-badge"><BuildingIcon /> Business Account</span>

          <BusinessBenefitsCard
            note="Business accounts are reviewed before activation. After signup your status will be Pending Approval."
          />

          <form className="login-form" onSubmit={handleSubmit} noValidate>

            <div className="form-group">
              <label htmlFor="b-bizname" className="form-label">
                Business Name <span className="form-required">*</span>
              </label>
              <input
                id="b-bizname" name="businessName" type="text"
                value={form.businessName} onChange={handleChange}
                placeholder="e.g. Malir Motors"
                className={`form-input${errors.businessName ? ' form-input--error' : ''}`}
              />
              {errors.businessName && <p className="form-error" role="alert">{errors.businessName}</p>}
            </div>

            <div className="login-form-row">
              <div className="form-group">
                <label htmlFor="b-owner" className="form-label">
                  Owner Name <span className="form-required">*</span>
                </label>
                <input
                  id="b-owner" name="ownerName" type="text"
                  value={form.ownerName} onChange={handleChange}
                  placeholder="e.g. Imran Sheikh"
                  className={`form-input${errors.ownerName ? ' form-input--error' : ''}`}
                  autoComplete="name"
                />
                {errors.ownerName && <p className="form-error" role="alert">{errors.ownerName}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="b-phone" className="form-label">
                  Phone <span className="form-required">*</span>
                </label>
                <input
                  id="b-phone" name="phone" type="tel"
                  value={form.phone} onChange={handleChange}
                  placeholder="03XX-XXXXXXX"
                  className={`form-input${errors.phone ? ' form-input--error' : ''}`}
                  autoComplete="tel"
                />
                {errors.phone && <p className="form-error" role="alert">{errors.phone}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="b-email" className="form-label">
                Email Address <span className="form-required">*</span>
              </label>
              <input
                id="b-email" name="email" type="email"
                value={form.email} onChange={handleChange}
                placeholder="business@example.com"
                className={`form-input${errors.email ? ' form-input--error' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="form-error" role="alert">{errors.email}</p>}
            </div>

            <PasswordField
              id="b-password" name="password" label="Password *"
              value={form.password} onChange={handleChange}
              error={errors.password}
            />

            <PasswordField
              id="b-confirm-password" name="confirmPassword" label="Confirm Password *"
              value={form.confirmPassword} onChange={handleChange}
              placeholder="Re-enter your password"
              error={errors.confirmPassword}
            />

            <div className="login-form-row">
              <div className="form-group">
                <label htmlFor="b-category" className="form-label">
                  Business Type <span className="form-required">*</span>
                </label>
                <div className="form-select-wrap">
                  <select
                    id="b-category" name="category"
                    value={form.category} onChange={handleChange}
                    className={`form-select${errors.category ? ' form-select--error' : ''}`}
                  >
                    <option value="" disabled>Select…</option>
                    {BUSINESS_TYPE_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
                {errors.category && <p className="form-error" role="alert">{errors.category}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="b-area" className="form-label">
                  Business Area <span className="form-required">*</span>
                </label>
                <input
                  id="b-area" name="area" type="text"
                  value={form.area} onChange={handleChange}
                  placeholder="e.g. Malir Cantt Gate 1"
                  className={`form-input${errors.area ? ' form-input--error' : ''}`}
                />
                {errors.area && <p className="form-error" role="alert">{errors.area}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="b-verify" className="form-label">
                Business Verification
                <span className="login-optional"> (optional)</span>
              </label>
              <input
                id="b-verify" name="verification" type="text"
                value={form.verification} onChange={handleChange}
                placeholder="e.g. CNIC, trade licence number, shop number"
                className="form-input"
              />
              <p className="form-helper" style={{ marginTop: 6 }}>
                Verification helps build trust with buyers. Not required to continue.
              </p>
            </div>

            {errors._general && <p className="form-error" role="alert">{errors._general}</p>}
            <button type="submit" className="login-submit" disabled={sending}>
              {sending ? 'Creating account…' : 'Create Business Account'}
            </button>
            <p className="login-terms">
              By creating an account you agree to our{' '}
              <Link to="/" className="login-terms__link">Terms of Service</Link>.
            </p>
          </form>
        </motion.div>
      )}

      {stage === 'verify' && (
        <motion.div key="verify" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <EmailVerificationScreen
            email={form.email}            onVerify={(code) => verifyEmail(form.email, code)}
            notice={verifyNotice}
            // Account + business application are created server-side at register;
            // verifying the email signs the user in (status stays Pending Approval).
            onSuccess={() => setStage('done')}
            onResend={handleResend}
            onBack={() => setStage('form')}
          />
        </motion.div>
      )}

      {stage === 'done' && (
        <motion.div key="done" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <BusinessPendingSuccess />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Register panel (orchestrates picker + forms) ────────────────────────────── */

function RegisterPanel({ initialType = null, onAuthenticated, onSwitchToSignIn }) {
  const [accountType, setAccountType] = useState(initialType);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!accountType ? (
        <motion.div key="picker" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <AccountTypePicker onSelect={setAccountType} />
        </motion.div>
      ) : (
        <motion.div key={accountType} variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          {accountType === 'personal'
            ? <PersonalForm onBack={() => setAccountType(null)} onAuthenticated={onAuthenticated} />
            : <BusinessForm onBack={() => setAccountType(null)} onSwitchToSignIn={onSwitchToSignIn} />
          }
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Sign in form ────────────────────────────────────────────────────────────── */

function SignInForm({ onAuthenticated }) {
  const { login } = useAuth();
  const [showForgot, setShowForgot] = useState(false);
  const [form, setForm]             = useState({ email: '', password: '' });
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      onAuthenticated();
    } catch (err) {
      setSubmitting(false);
      setError(err?.message || 'Could not sign in. Please try again.');
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showForgot ? (
        <motion.div key="forgot" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
          <ForgotPasswordFlow onBack={() => setShowForgot(false)} />
        </motion.div>
      ) : (
        <motion.div key="signin" variants={STEP_VARIANTS} initial="initial" animate="enter" exit="exit">
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="signin-email" className="form-label">Email or Phone</label>
                <input
                  id="signin-email" name="email" type="text"
                  value={form.email} onChange={handleChange}
                  placeholder="you@example.com or 03XX-XXXXXXX"
                  className="form-input" autoComplete="username" required
                />
              </div>
              <div className="form-group">
                <div className="login-label-row">
                  <label htmlFor="signin-password" className="form-label">Password</label>
                  <button
                    type="button"
                    className="login-forgot"
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="login-pw-wrap">
                  <input
                    id="signin-password" name="password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password} onChange={handleChange}
                    placeholder="Enter your password"
                    className="form-input login-pw-input"
                    autoComplete="current-password" required
                  />
                  <button
                    type="button" className="login-pw-toggle"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="submit" className="login-submit" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const registerParam = searchParams.get('register'); // null | 'business' | 'personal' | ''
  const [tab, setTab] = useState(registerParam != null ? 'register' : 'signin');
  // Deep-link from "Apply for Business Account" pre-selects the Business form.
  const initialRegisterType = registerParam === 'business' || registerParam === 'personal'
    ? registerParam
    : null;

  // Where to send the user after a successful sign-in / verification. A protected
  // route (e.g. Add Listing) sets `?redirect=…`; otherwise fall back to home.
  // The actual auth call happens inside the forms (via AuthContext); this only
  // navigates once the session is established.
  const redirectTo = searchParams.get('redirect') || '/';
  const handleAuthSuccess = () => navigate(redirectTo, { replace: true });

  return (
    <PageTransition>
      <main className="login-page">
        <div className="login-card">

          {/* Dark header */}
          <div className="login-card__header">
            <div className="login-card__header-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="21" x2="5" y2="5"/>
                <line x1="2" y1="21" x2="8" y2="21"/>
                <rect x="3.5" y="8" width="3" height="3.5" rx="0.6"/>
                <line x1="6.5" y1="9.5" x2="22" y2="6.2"/>
                <line x1="3.5" y1="9.5" x2="2" y2="12.5"/>
                <line x1="11" y1="9" x2="11.7" y2="7.4"/>
                <line x1="16" y1="8.1" x2="16.7" y2="6.5"/>
              </svg>
            </div>
            <p className="login-card__header-title">PEOPLE OF MALIR CANTT BAZAAR</p>
            <p className="login-card__header-sub">For Malir Cantt residents only</p>
          </div>

          {/* Body */}
          <div className="login-card__body">

            {/* Tabs */}
            <div className="login-tabs" role="tablist" aria-label="Sign in or create account">
              <button
                role="tab"
                aria-selected={tab === 'signin'}
                className={`login-tab${tab === 'signin' ? ' login-tab--active' : ''}`}
                onClick={() => setTab('signin')}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={tab === 'register'}
                className={`login-tab${tab === 'register' ? ' login-tab--active' : ''}`}
                onClick={() => setTab('register')}
              >
                Create Account
              </button>
            </div>

            {/* Panel */}
            <div className="login-panel-wrap">
              <AnimatePresence mode="wait" initial={false}>
                {tab === 'signin' ? (
                  <motion.div key="signin" variants={TAB_VARIANTS} initial="initial" animate="enter" exit="exit">
                    <SignInForm onAuthenticated={handleAuthSuccess} />
                  </motion.div>
                ) : (
                  <motion.div key="register" variants={TAB_VARIANTS} initial="initial" animate="enter" exit="exit">
                    <RegisterPanel initialType={initialRegisterType} onAuthenticated={handleAuthSuccess} onSwitchToSignIn={() => setTab('signin')} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Footer */}
          <div className="login-card__footer">
            <Link to="/" className="login-card__back">← Back to Bazaar</Link>
          </div>

        </div>
      </main>
    </PageTransition>
  );
}
