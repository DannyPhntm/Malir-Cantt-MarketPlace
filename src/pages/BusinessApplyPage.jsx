import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import LoadingState from '../components/LoadingState';
import BusinessBenefitsCard from '../components/BusinessBenefitsCard';
import { useAuth } from '../context/AuthContext';
import { BUSINESS_TYPE_OPTIONS } from '../data/businessTypes';
import './BusinessApplyPage.css';

/* In-app "Apply for a business account" for an already-logged-in user. Upgrades
   the SAME account (userId) — never creates a second login. */
export default function BusinessApplyPage() {
  const { isAuthenticated, loading, profile, businessStatus, isApprovedSeller, applyForBusinessSeller } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ businessName: profile?.businessName || '', businessType: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <PageTransition><main className="bizapply"><LoadingState label="Loading…" /></main></PageTransition>;
  }
  if (!isAuthenticated) { navigate('/login?redirect=/apply-business'); return null; }

  const change = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.businessName.trim()) errs.businessName = 'Business name is required.';
    if (!form.businessType) errs.businessType = 'Pick a business type.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true); setErrors({});
    try {
      await applyForBusinessSeller({ businessName: form.businessName.trim(), businessType: form.businessType });
    } catch (err) {
      setErrors({ _general: err?.message || 'Could not submit your application. Please try again.' });
    } finally { setSubmitting(false); }
  };

  // Status views — same account, business status attached.
  const statusView = (() => {
    if (isApprovedSeller || businessStatus === 'approved') {
      return (
        <div className="bizapply__status bizapply__status--approved">
          <h1>You're an approved business</h1>
          <p>Your account can post business listings, show a verified business identity, and manage a shop profile.</p>
          <div className="bizapply__actions">
            <Link to="/my-shop" className="bizapply__btn">Manage your shop</Link>
            <Link to="/add-listing" className="bizapply__btn bizapply__btn--ghost">Post a business listing</Link>
          </div>
        </div>
      );
    }
    if (businessStatus === 'pending') {
      return (
        <div className="bizapply__status bizapply__status--pending">
          <h1>Your business application is under review</h1>
          <p>An admin will review your application shortly. You can keep posting personal listings in the meantime.</p>
          <Link to="/dashboard" className="bizapply__btn">Back to dashboard</Link>
        </div>
      );
    }
    return null; // none / rejected → show the form
  })();

  if (statusView) {
    return <PageTransition><main className="bizapply"><div className="bizapply__inner">{statusView}</div></main></PageTransition>;
  }

  return (
    <PageTransition>
      <main className="bizapply">
        <div className="bizapply__inner">
          <h1 className="bizapply__title">Apply for a business account</h1>
          <p className="bizapply__lead">
            Upgrade your existing account — same login, same email. Once approved you can post business
            listings, show a verified business identity, and manage a shop profile.
          </p>

          {businessStatus === 'rejected' && (
            <div className="bizapply__rejected">
              Your previous application was not approved. You can update your details and reapply, or contact support.
            </div>
          )}

          <BusinessBenefitsCard note="Applications are reviewed by an admin. Your status will be Pending Approval after you apply." />

          <form className="bizapply__form" onSubmit={submit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="ba-name">Business name <span className="form-required">*</span></label>
              <input id="ba-name" name="businessName" className={`form-input${errors.businessName ? ' form-input--error' : ''}`}
                value={form.businessName} onChange={change} placeholder="e.g. Malir Motors" />
              {errors.businessName && <p className="form-error" role="alert">{errors.businessName}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ba-type">Business type <span className="form-required">*</span></label>
              <div className="form-select-wrap">
                <select id="ba-type" name="businessType" className="form-select" value={form.businessType} onChange={change}>
                  <option value="">Select…</option>
                  {BUSINESS_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {errors.businessType && <p className="form-error" role="alert">{errors.businessType}</p>}
            </div>
            {errors._general && <p className="form-error" role="alert">{errors._general}</p>}
            <button type="submit" className="bizapply__btn" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Apply for business access'}
            </button>
          </form>
        </div>
      </main>
    </PageTransition>
  );
}
