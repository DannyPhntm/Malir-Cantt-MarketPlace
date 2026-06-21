import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import contactApi from '../services/contactApi';
import './ContactPage.css';

// Inquiry types — also the category options on the form.
const INQUIRY_TYPES = [
  { value: 'general',    label: 'General inquiries',        desc: 'Questions about using the marketplace.' },
  { value: 'business',   label: 'Business inquiries',       desc: 'Verified business accounts & partnerships.' },
  { value: 'featured',   label: 'Featured listing inquiries', desc: 'Boost a listing with featured placement.' },
  { value: 'bug',        label: 'Bug reports',              desc: 'Something not working as expected.' },
  { value: 'scam',       label: 'Scam or fraud reports',    desc: 'Report a suspicious listing or seller.' },
  { value: 'suggestion', label: 'Suggestions',              desc: 'Ideas to make the marketplace better.' },
];

// Placeholder — no live email integration yet.
const SUPPORT_EMAIL = 'support@malircantt.pk';

const EMPTY = { name: '', email: '', subject: '', message: '', category: 'general' };

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (!form.subject.trim() || form.subject.trim().length < 3) errs.subject = 'Please add a subject.';
    if (!form.message.trim() || form.message.trim().length < 10) errs.message = 'Message must be at least 10 characters.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      document.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setSending(true);
    setErrors((prev) => ({ ...prev, submit: '' }));
    try {
      await contactApi.send({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        category: form.category,
      });
      setSent(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      // Map server field errors back to inputs when present.
      if (err?.fields) setErrors((prev) => ({ ...prev, ...err.fields }));
      else setErrors((prev) => ({ ...prev, submit: err?.message || 'Could not send your message. Please try again.' }));
    } finally {
      setSending(false);
    }
  };

  return (
    <PageTransition>
      <main className="contact">

        {/* Hero */}
        <header className="contact__hero">
          <div className="contact__hero-inner">
            <nav className="breadcrumb contact__breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="breadcrumb__link">Home</Link>
              <span className="breadcrumb__sep" aria-hidden="true">/</span>
              <span className="breadcrumb__current">Contact</span>
            </nav>
            <h1 className="contact__title">Contact Us</h1>
            <p className="contact__subtitle">
              Questions, business inquiries, or something to report? Reach the People of
              Malir Cantt Bazaar team below.
            </p>
          </div>
        </header>

        <div className="contact__body">

          {/* Channels + response expectations */}
          <section className="contact__channels" aria-label="Contact channels">
            <div className="contact__channel">
              <span className="contact__channel-label">Email</span>
              <span className="contact__channel-value">{SUPPORT_EMAIL}</span>
            </div>
            <div className="contact__channel">
              <span className="contact__channel-label">Response time</span>
              <span className="contact__channel-value">Within 1–2 business days</span>
            </div>
          </section>

          <div className="contact__grid">

            {/* Inquiry types */}
            <aside className="contact__types" aria-label="What can we help with">
              <h2 className="contact__types-title">What can we help with?</h2>
              <ul className="contact__types-list">
                {INQUIRY_TYPES.map((t) => (
                  <li key={t.value} className="contact__type">
                    <span className="contact__type-label">{t.label}</span>
                    <span className="contact__type-desc">{t.desc}</span>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Form */}
            <section className="contact__form-wrap">
              {sent ? (
                <div className="contact__success">
                  <div className="contact__success-icon" aria-hidden="true">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h2 className="contact__success-title">Message sent</h2>
                  <p className="contact__success-text">
                    Thanks for reaching out — we've received your message and will reply within
                    1–2 business days.
                  </p>
                  <button type="button" className="contact__success-again"
                    onClick={() => { setForm(EMPTY); setSent(false); }}>
                    Send another message
                  </button>
                </div>
              ) : (
                <form className="contact__form" onSubmit={handleSubmit} noValidate>
                  <h2 className="contact__form-title">Send us a message</h2>

                  <div className="contact__field">
                    <label htmlFor="c-category" className="contact__label">Reason</label>
                    <div className="contact__select-wrap">
                      <select id="c-category" name="category" value={form.category} onChange={handleChange} className="contact__select">
                        {INQUIRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <svg className="contact__select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  <div className="contact__row">
                    <div className="contact__field">
                      <label htmlFor="c-name" className="contact__label">Name <span className="contact__req">*</span></label>
                      <input id="c-name" name="name" type="text" value={form.name} onChange={handleChange}
                        className={`contact__input${errors.name ? ' contact__input--error' : ''}`} placeholder="Your name" maxLength={100} />
                      {errors.name && <p className="contact__error" role="alert">{errors.name}</p>}
                    </div>
                    <div className="contact__field">
                      <label htmlFor="c-email" className="contact__label">Email <span className="contact__req">*</span></label>
                      <input id="c-email" name="email" type="email" value={form.email} onChange={handleChange}
                        className={`contact__input${errors.email ? ' contact__input--error' : ''}`} placeholder="you@example.com" autoComplete="email" />
                      {errors.email && <p className="contact__error" role="alert">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="contact__field">
                    <label htmlFor="c-subject" className="contact__label">Subject <span className="contact__req">*</span></label>
                    <input id="c-subject" name="subject" type="text" value={form.subject} onChange={handleChange}
                      className={`contact__input${errors.subject ? ' contact__input--error' : ''}`} placeholder="How can we help?" maxLength={150} />
                    {errors.subject && <p className="contact__error" role="alert">{errors.subject}</p>}
                  </div>

                  <div className="contact__field">
                    <label htmlFor="c-message" className="contact__label">Message <span className="contact__req">*</span></label>
                    <textarea id="c-message" name="message" value={form.message} onChange={handleChange}
                      className={`contact__textarea${errors.message ? ' contact__textarea--error' : ''}`} rows={6} placeholder="Write your message…" maxLength={2000} />
                    {errors.message && <p className="contact__error" role="alert">{errors.message}</p>}
                  </div>

                  {errors.submit && <p className="contact__error" role="alert">{errors.submit}</p>}

                  <button type="submit" className="contact__submit" disabled={sending}>
                    {sending ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
