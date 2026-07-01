import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import LoadingState from '../components/LoadingState';
import BusinessBenefitsCard from '../components/BusinessBenefitsCard';
import { useAuth } from '../context/AuthContext';
import { BUSINESS_TYPE_OPTIONS } from '../data/businessTypes';
import { MAX_IMAGE_BYTES, isAcceptableImageFile, isImageFile } from '../lib/imageUpload';
import './BusinessApplyPage.css';

/* In-app "Apply for a business account" for an already-logged-in user. Upgrades
   the SAME account (userId) — never creates a second login. */
export default function BusinessApplyPage() {
  const { isAuthenticated, loading, profile, businessStatus, isApprovedSeller, businessRequest, applyForBusinessSeller } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: profile?.businessName || '',
    businessType: '',
    businessAddress: '',
    businessPhone: profile?.phone || '',
    ntnNumber: '',
  });
  const [verificationFile, setVerificationFile] = useState(null);
  const [cnicFile, setCnicFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const verifInputRef = useRef(null);
  const cnicInputRef = useRef(null);

  const pickFile = (setter, field) => (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!isImageFile(file)) { setErrors((p) => ({ ...p, [field]: 'Please choose an image file.' })); return; }
    if (file.size > MAX_IMAGE_BYTES) { setErrors((p) => ({ ...p, [field]: 'Image must be 5 MB or smaller.' })); return; }
    setter(file);
    setErrors((p) => ({ ...p, [field]: '' }));
  };

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
    if (form.businessAddress.trim().length < 5) errs.businessAddress = 'Business address is required.';
    if (!/^0\d{3}-?\d{7}$/.test(form.businessPhone.trim())) errs.businessPhone = 'Enter a valid phone (03XX-XXXXXXX).';
    if (!verificationFile) errs.verificationDoc = 'A verification document photo is required.';
    else if (!isAcceptableImageFile(verificationFile)) errs.verificationDoc = 'Document must be an image, 5 MB or smaller.';
    if (cnicFile && !isAcceptableImageFile(cnicFile)) errs.cnicDoc = 'CNIC photo must be an image, 5 MB or smaller.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true); setErrors({});
    try {
      const fd = new FormData();
      fd.append('businessName', form.businessName.trim());
      fd.append('businessType', form.businessType);
      fd.append('businessAddress', form.businessAddress.trim());
      fd.append('businessPhone', form.businessPhone.trim());
      if (form.ntnNumber.trim()) fd.append('ntnNumber', form.ntnNumber.trim());
      fd.append('verificationDoc', verificationFile);
      if (cnicFile) fd.append('cnicDoc', cnicFile);
      await applyForBusinessSeller(fd);
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
              Your business application was not approved. Please contact support or submit clearer verification proof.
              {businessRequest?.adminNotes && (
                <span className="bizapply__reject-reason"> Reason: {businessRequest.adminNotes}</span>
              )}
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
                <svg className="form-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {errors.businessType && <p className="form-error" role="alert">{errors.businessType}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ba-address">Business address <span className="form-required">*</span></label>
              <input id="ba-address" name="businessAddress" className={`form-input${errors.businessAddress ? ' form-input--error' : ''}`}
                value={form.businessAddress} onChange={change} placeholder="Shop #, street / market, Malir Cantt sector" />
              {errors.businessAddress && <p className="form-error" role="alert">{errors.businessAddress}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ba-phone">Business phone / WhatsApp <span className="form-required">*</span></label>
              <input id="ba-phone" name="businessPhone" className={`form-input${errors.businessPhone ? ' form-input--error' : ''}`}
                value={form.businessPhone} onChange={change} placeholder="0300-0000000" inputMode="tel" />
              {errors.businessPhone && <p className="form-error" role="alert">{errors.businessPhone}</p>}
            </div>

            {/* Business verification — admin-only documents */}
            <div className="bizapply__verify">
              <h2 className="bizapply__verify-title">Business verification</h2>
              <p className="bizapply__verify-text">
                To keep the marketplace trusted, upload a photo of a bill, receipt, business card, rent
                document, or anything showing your business name/address. This is only visible to admins.
              </p>

              <div className="form-group">
                <label className="form-label">Verification document <span className="form-required">*</span></label>
                <input ref={verifInputRef} type="file" accept="image/*" hidden onChange={pickFile(setVerificationFile, 'verificationDoc')} />
                <div className="bizapply__upload-row">
                  <button type="button" className="bizapply__btn bizapply__btn--ghost bizapply__upload-btn" onClick={() => verifInputRef.current?.click()}>
                    {verificationFile ? 'Change document' : 'Upload document'}
                  </button>
                  <span className="bizapply__file-name">{verificationFile ? verificationFile.name : 'No file selected'}</span>
                </div>
                {errors.verificationDoc && <p className="form-error" role="alert">{errors.verificationDoc}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Owner CNIC photo <span className="bizapply__optional">(optional)</span></label>
                <input ref={cnicInputRef} type="file" accept="image/*" hidden onChange={pickFile(setCnicFile, 'cnicDoc')} />
                <div className="bizapply__upload-row">
                  <button type="button" className="bizapply__btn bizapply__btn--ghost bizapply__upload-btn" onClick={() => cnicInputRef.current?.click()}>
                    {cnicFile ? 'Change CNIC photo' : 'Upload CNIC photo'}
                  </button>
                  <span className="bizapply__file-name">{cnicFile ? cnicFile.name : 'No file selected'}</span>
                </div>
                {errors.cnicDoc && <p className="form-error" role="alert">{errors.cnicDoc}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ba-ntn">NTN / registration number <span className="bizapply__optional">(optional)</span></label>
                <input id="ba-ntn" name="ntnNumber" className="form-input" value={form.ntnNumber} onChange={change} placeholder="If you have one" />
              </div>
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
