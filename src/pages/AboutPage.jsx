import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { usePublicStats } from '../hooks/usePublicStats';
import './AboutPage.css';

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-PK') : '—');

const FEATURES = [
  {
    title: 'Safe community buying & selling',
    body: 'A marketplace built for neighbours, not strangers. Meet locally, inspect before you pay, and deal with people from your own community.',
  },
  {
    title: 'Resident-focused',
    body: 'Made specifically for Malir Cantt residents. Listings, sellers, and buyers are all part of the same local community — closer, faster, more trustworthy.',
  },
  {
    title: 'Business opportunities',
    body: 'Local shops, home businesses, and entrepreneurs can reach thousands of nearby buyers — from food kitchens to electronics and services.',
  },
  {
    title: 'Verified business accounts',
    body: 'Approved businesses earn a Verified Business badge, unlocking reserved categories and signalling trust to buyers across the marketplace.',
  },
  {
    title: 'Home businesses & entrepreneurs',
    body: 'Run a kitchen, a tailoring service, or a small workshop from home? List it here and turn your skills into a local customer base.',
  },
  {
    title: 'Featured listings',
    body: 'Sellers can request a Featured placement for extra visibility. Featured status is admin-approved — no auto-promotion, no fake hype.',
  },
];

export default function AboutPage() {
  const stats = usePublicStats();

  return (
    <PageTransition>
      <main className="about">

        {/* Hero */}
        <header className="about__hero">
          <div className="about__hero-inner">
            <nav className="breadcrumb about__breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="breadcrumb__link">Home</Link>
              <span className="breadcrumb__sep" aria-hidden="true">/</span>
              <span className="breadcrumb__current">About</span>
            </nav>
            <h1 className="about__title">About Malir Cantt Marketplace</h1>
            <p className="about__subtitle">
              The trusted, community-only marketplace for Malir Cantt — buy, sell, and
              connect with verified neighbours and local businesses.
            </p>
          </div>
        </header>

        <div className="about__body">

          {/* Real stats strip */}
          <section className="about__stats" aria-label="Marketplace statistics">
            <div className="about__stat">
              <span className="about__stat-value">{fmt(stats?.activeListings)}</span>
              <span className="about__stat-label">Active Listings</span>
            </div>
            <div className="about__stat">
              <span className="about__stat-value">{fmt(stats?.users)}</span>
              <span className="about__stat-label">Registered Users</span>
            </div>
            <div className="about__stat">
              <span className="about__stat-value">{fmt(stats?.verifiedBusinesses)}</span>
              <span className="about__stat-label">Verified Businesses</span>
            </div>
            <div className="about__stat">
              <span className="about__stat-value">{stats ? stats.categories : '—'}</span>
              <span className="about__stat-label">Categories</span>
            </div>
          </section>

          {/* Intro */}
          <section className="about__section">
            <h2 className="about__section-title">What is Malir Cantt Marketplace?</h2>
            <p className="about__lead">
              Malir Cantt Marketplace is a local classifieds platform built exclusively for the
              Malir Cantonment community. Instead of dealing with strangers across the city, you
              buy and sell with verified neighbours — making every transaction simpler, faster,
              and safer. From vehicles and property to electronics, furniture, jobs, services,
              and home kitchens, it's one trusted place for everything happening inside Malir Cantt.
            </p>
          </section>

          {/* Feature grid */}
          <section className="about__section">
            <h2 className="about__section-title">Why it's different</h2>
            <div className="about__grid">
              {FEATURES.map((f) => (
                <div key={f.title} className="about__card">
                  <h3 className="about__card-title">{f.title}</h3>
                  <p className="about__card-body">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Vision */}
          <section className="about__section about__vision">
            <h2 className="about__section-title">Where we're headed</h2>
            <p className="about__lead">
              We're building Malir Cantt Marketplace into the everyday home for local commerce —
              with in-app messaging, richer business profiles, smarter discovery, and tools that
              help local entrepreneurs grow. Every step keeps the same promise: a trustworthy,
              resident-first marketplace with no fake numbers and no anonymous strangers.
            </p>
            <div className="about__cta">
              <Link to="/add-listing" className="about__cta-primary">Post a Listing</Link>
              <Link to="/login?register=business" className="about__cta-secondary">Become a Verified Business</Link>
            </div>
          </section>

        </div>
      </main>
    </PageTransition>
  );
}
