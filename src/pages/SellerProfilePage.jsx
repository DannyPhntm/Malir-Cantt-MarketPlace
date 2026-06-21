import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useListings } from '../context/ListingsContext';
import ListingCard from '../components/ListingCard';
import VerifiedBadge from '../components/VerifiedBadge';
import LoadingState from '../components/LoadingState';
import PageTransition from '../components/PageTransition';
import { staggerContainer, staggerItem } from '../animations';
import './SellerProfilePage.css';
import './CategoryPage.css';

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92v2z"/>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function SellerProfilePage() {
  const { sellerName } = useParams();
  const name = decodeURIComponent(sellerName);
  const { allListings, loading } = useListings();
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [copied, setCopied]               = useState(false);

  const sellerListings = useMemo(
    () => allListings.filter(l => l.seller?.name === name),
    [allListings, name]
  );

  if (loading) {
    return (
      <PageTransition>
        <main className="sp-page">
          <LoadingState label="Loading seller…" />
        </main>
      </PageTransition>
    );
  }

  if (sellerListings.length === 0) {
    return (
      <PageTransition>
        <main className="sp-page">
          <div className="sp-hero">
            <div className="sp-inner">
              <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link to="/" className="breadcrumb__link">Home</Link>
                <span className="breadcrumb__sep" aria-hidden="true">/</span>
                <span className="breadcrumb__current">Seller Not Found</span>
              </nav>
              <h1 className="sp-hero__title">Seller Not Found</h1>
            </div>
          </div>
          <div className="sp-content">
            <div className="sp-inner sp-not-found">
              <p className="sp-not-found__text">No listings found for "{name}".</p>
              <Link to="/listings" className="cat-empty__cta">Browse All Listings</Link>
            </div>
          </div>
        </main>
      </PageTransition>
    );
  }

  const seller = sellerListings[0].seller;
  const isVerified   = !!seller.isVerified;
  const isBusiness   = seller.badgeType === 'business';
  const accountLabel = isBusiness ? 'Business Account' : 'Personal Account';
  const area         = seller.area || 'Malir Cantt';
  const joinDate     = seller.memberSince ? `Member since ${seller.memberSince}` : null;
  // Business type from the seller's account (falls back to first listing's category).
  const BIZ_TYPE_LABELS = {
    'food-beverage': 'Food & Beverage', 'home-decor': 'Home Decor', furniture: 'Furniture',
    electronics: 'Electronics', automotive: 'Automotive', fashion: 'Fashion', fitness: 'Fitness',
    services: 'Services', education: 'Education', beauty: 'Beauty', health: 'Health',
    'real-estate': 'Real Estate', other: 'Other',
  };
  const businessCategory = isBusiness
    ? (BIZ_TYPE_LABELS[seller.businessType] || seller.businessType || sellerListings[0]?.category || null)
    : null;

  // Initials from first letter of each word (max 2)
  const initials = name.split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2);

  const stats = {
    total:  sellerListings.length,
    active: sellerListings.length,
    sold:   0,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(seller.phone);
    } catch {
      const el = document.createElement('input');
      el.value = seller.phone;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageTransition>
      <main className="sp-page">

        {/* ── Dark green header ── */}
        <div className="sp-hero">
          <div className="sp-inner">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="breadcrumb__link">Home</Link>
              <span className="breadcrumb__sep" aria-hidden="true">/</span>
              <Link to="/listings" className="breadcrumb__link">Listings</Link>
              <span className="breadcrumb__sep" aria-hidden="true">/</span>
              <span className="breadcrumb__current">{name}</span>
            </nav>
            <h1 className="sp-hero__title">{name}</h1>
            <p className="sp-hero__sub">
              {isVerified ? (isBusiness ? 'Verified Business' : 'Verified Resident') : accountLabel}
              {' · '}People of Malir Cantt Bazaar
            </p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="sp-content">
          <div className="sp-inner">

            {/* ── Profile card ── */}
            <div className="sp-card">
              <div className="sp-card__top">

                {/* Avatar */}
                <div className="sp-avatar" aria-hidden="true">{initials}</div>

                {/* Info */}
                <div className="sp-card__info">
                  <div className="sp-card__name-row">
                    <h2 className="sp-card__name">{name}</h2>
                    {isVerified && <VerifiedBadge type={seller.badgeType} size="md" />}
                  </div>

                  <div className="sp-card__meta">
                    <span className="sp-meta-pill">
                      <PersonIcon />{accountLabel}
                    </span>
                    <span className="sp-meta-pill">
                      <PinIcon />{area}
                    </span>
                    {joinDate && (
                      <span className="sp-meta-pill">
                        <CalendarIcon />{joinDate}
                      </span>
                    )}
                    {isBusiness && businessCategory && (
                      <span className="sp-meta-pill sp-meta-pill--business">
                        <BriefcaseIcon />{businessCategory}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact action */}
                <div className="sp-card__contact">
                  {!phoneRevealed ? (
                    <button className="sp-contact-btn" onClick={() => setPhoneRevealed(true)}>
                      <PhoneIcon />
                      Contact Seller
                    </button>
                  ) : (
                    <div className="sp-phone-reveal">
                      <span className="sp-phone-number">{seller.phone}</span>
                      <div className="sp-phone-actions">
                        <a href={`tel:${seller.phone}`} className="sp-phone-btn sp-phone-btn--call">
                          <PhoneIcon /> Call
                        </a>
                        <button
                          className="sp-phone-btn sp-phone-btn--copy"
                          onClick={handleCopy}
                          disabled={copied}
                        >
                          {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="sp-stats">
                <div className="sp-stat">
                  <span className="sp-stat__value sp-stat__value--total">{stats.total}</span>
                  <span className="sp-stat__label">Total Listings</span>
                </div>
                <div className="sp-stat-divider" aria-hidden="true" />
                <div className="sp-stat">
                  <span className="sp-stat__value sp-stat__value--active">{stats.active}</span>
                  <span className="sp-stat__label">Active</span>
                </div>
                <div className="sp-stat-divider" aria-hidden="true" />
                <div className="sp-stat">
                  <span className="sp-stat__value sp-stat__value--sold">{stats.sold}</span>
                  <span className="sp-stat__label">Sold</span>
                </div>
              </div>
            </div>

            {/* ── Listings by this seller ── */}
            <div className="sp-listings">
              <h2 className="sp-listings__heading">
                Listings by {name}
                <span className="sp-listings__count">{stats.total}</span>
              </h2>

              <motion.div
                className="cat-grid"
                variants={staggerContainer(0.05)}
                initial="hidden"
                animate="visible"
              >
                {sellerListings.map(listing => (
                  <motion.div key={listing.id} variants={staggerItem}>
                    <ListingCard listing={listing} />
                  </motion.div>
                ))}
              </motion.div>
            </div>

          </div>
        </div>

      </main>
    </PageTransition>
  );
}
