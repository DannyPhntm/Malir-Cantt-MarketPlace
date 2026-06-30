import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { LEGAL_DOCS } from '../data/legalContent';
import './LegalPage.css';

/* Shared layout for the plain-language legal/safety pages (/terms, /privacy,
   /safety). Content lives in src/data/legalContent.js; this just renders it. */
export default function LegalPage({ doc }) {
  const data = LEGAL_DOCS[doc];
  if (!data) return null;

  return (
    <PageTransition>
      <main className="legal">
        <header className="legal__hero">
          <div className="legal__hero-inner">
            <nav className="breadcrumb legal__breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="breadcrumb__link">Home</Link>
              <span className="breadcrumb__sep" aria-hidden="true">/</span>
              <span className="breadcrumb__current">{data.title}</span>
            </nav>
            <h1 className="legal__title">{data.title}</h1>
            {data.subtitle && <p className="legal__subtitle">{data.subtitle}</p>}
            {data.updated && <p className="legal__updated">Last updated: {data.updated}</p>}
          </div>
        </header>

        <div className="legal__body">
          <p className="legal__disclaimer">
            This is a plain-language summary for our beta, not formal legal advice.
          </p>

          {data.intro?.map((para, i) => (
            <p key={`intro-${i}`} className="legal__lead">{para}</p>
          ))}

          {data.sections.map((s, i) => (
            <section key={s.h} className="legal__section">
              <h2 className="legal__section-title">{`${i + 1}. ${s.h}`}</h2>
              {s.p?.map((para, j) => (
                <p key={j} className="legal__text">{para}</p>
              ))}
              {s.list && (
                <ul className="legal__list">
                  {s.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}

          <div className="legal__footer-links">
            <Link to="/terms" className="legal__link">Terms</Link>
            <Link to="/privacy" className="legal__link">Privacy</Link>
            <Link to="/safety" className="legal__link">Safety</Link>
            <Link to="/contact" className="legal__link">Contact</Link>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
