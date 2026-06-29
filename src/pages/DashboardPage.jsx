import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import VerifiedBadge from '../components/VerifiedBadge';
import PageTransition from '../components/PageTransition';
import LoadingState from '../components/LoadingState';
import listingsApi from '../services/listingsApi';
import { adaptListing } from '../services/listingAdapter';
import { computeListingStats } from '../lib/listingStats';
import { staggerContainer, staggerItem, tap, dur, ease } from '../animations';
import './DashboardPage.css';

const MotionLink = motion(Link);

/* ── Icons ───────────────────────────────────────────────────────────────────── */

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.2"/>
      <rect x="14" y="3" width="7" height="7" rx="1.2"/>
      <rect x="3" y="14" width="7" height="7" rx="1.2"/>
      <rect x="14" y="14" width="7" height="7" rx="1.2"/>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

/* ── Dashboard card ──────────────────────────────────────────────────────────── */

function DashCard({ icon, title, desc, badge, soon, to, onClick }) {
  const inner = (
    <>
      <div className="dash-card__icon">{icon}</div>
      <div className="dash-card__body">
        <div className="dash-card__header">
          <p className="dash-card__title">{title}</p>
          {badge != null && <span className="dash-card__badge">{badge}</span>}
          {soon && <span className="dash-card__soon">Soon</span>}
        </div>
        <p className="dash-card__desc">{desc}</p>
      </div>
      <span className="dash-card__arrow"><ArrowIcon /></span>
    </>
  );

  // Soon cards: visible but not interactive
  if (soon) {
    return (
      <motion.div className="dash-card dash-card--soon" variants={staggerItem}>
        {inner}
      </motion.div>
    );
  }

  // Action cards (e.g. open FavoritesDrawer)
  if (onClick) {
    return (
      <motion.button
        type="button"
        className="dash-card"
        onClick={onClick}
        variants={staggerItem}
        whileTap={tap}
      >
        {inner}
      </motion.button>
    );
  }

  // Navigation cards
  return (
    <MotionLink
      to={to}
      className="dash-card"
      variants={staggerItem}
      whileTap={tap}
    >
      {inner}
    </MotionLink>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { userType, profile, businessStatus } = useAuth();
  const { favorites } = useFavorites();

  const [listings, setListings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listingsApi.mine();
      setListings(res.listings.map(adaptListing));
    } catch (e) {
      setError(e?.message || 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: load the dashboard's listings on mount
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => computeListingStats(listings || []), [listings]);

  const initials = (profile.name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const accountTypeLabel = userType === 'business' ? 'Business' : 'Personal';
  const businessLabel =
    businessStatus === 'approved' ? 'Verified business'
    : businessStatus === 'pending' ? 'Pending review'
    : 'Personal account';

  const savedCount = favorites.length;

  const STAT_TILES = [
    { key: 'active',          label: 'Active',           accent: 'primary' },
    { key: 'pending',         label: 'Pending',          accent: 'gold' },
    { key: 'sold',            label: 'Sold',             accent: 'gold' },
    { key: 'hidden',          label: 'Hidden' },
    { key: 'rejected',        label: 'Rejected' },
    { key: 'featured',        label: 'Featured',         accent: 'gold' },
    { key: 'pendingFeatured', label: 'Featured Pending', accent: 'gold' },
  ];

  const cards = [
    {
      icon:  <GridIcon />,
      title: 'My Listings',
      desc:  'View and manage your active posts',
      to:    '/my-listings',
    },
    {
      icon:  <HeartIcon />,
      title: 'Saved Listings',
      desc:  savedCount > 0
        ? `${savedCount} saved item${savedCount !== 1 ? 's' : ''}`
        : 'Browse items you\'ve saved for later',
      badge: savedCount > 0 ? savedCount : undefined,
      to:    '/saved-listings',
    },
    {
      icon:  <MessageIcon />,
      title: 'Messages',
      desc:  'Chat with buyers and sellers',
      soon:  true,
    },
    {
      icon:  <PersonIcon />,
      title: 'Profile',
      desc:  'Edit your personal details',
      to:    '/profile',
    },
    {
      icon:  <SettingsIcon />,
      title: 'Settings',
      desc:  'Notifications, privacy, and account',
      soon:  true,
    },
  ];

  if (userType === 'business') {
    cards.push({
      icon:  <BuildingIcon />,
      title: 'My Shop',
      desc:  businessStatus === 'approved'
        ? 'Create or edit your shop in the directory'
        : 'Approve your business to add a shop',
      to:    '/my-shop',
    });
  } else {
    // Personal accounts can upgrade the SAME account to a business application.
    cards.push({
      icon:  <BuildingIcon />,
      title: 'Apply for a business account',
      desc:  'Want to post as a shop or business? Unlock business listings, a shop profile, and verified business features.',
      to:    '/apply-business',
    });
  }

  return (
    <PageTransition>
      <main className="dash-page">
        <div className="dash-inner">

          {/* ── Profile card ───────────────────────────────────────────────── */}
          <motion.section
            className="dash-profile-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur.slow, ease: ease.out }}
          >
            <div className="dash-avatar" aria-hidden="true">{initials}</div>

            <div className="dash-profile-info">
              <div className="dash-profile-top">
                <h1 className="dash-profile-name">{profile.name}</h1>
                {profile.isVerified && (
                  <VerifiedBadge type={profile.badgeType} size="md" />
                )}
              </div>

              {userType === 'business' && profile.businessName && (
                <p className="dash-profile-biz">{profile.businessName}</p>
              )}

              <div className="dash-profile-meta">
                <span className="dash-profile-type">{accountTypeLabel}</span>
                {profile.area && (
                  <>
                    <span className="dash-meta-sep" aria-hidden="true">·</span>
                    <span className="dash-profile-area">{profile.area}</span>
                  </>
                )}
                {profile.joinDate && (
                  <>
                    <span className="dash-meta-sep" aria-hidden="true">·</span>
                    <span className="dash-profile-joined">Joined {profile.joinDate}</span>
                  </>
                )}
              </div>
            </div>

            <Link to="/add-listing" className="dash-profile-cta">
              + Add Listing
            </Link>
          </motion.section>

          {/* ── Overview (real backend data) ───────────────────────────────── */}
          <div className="dash-section">
            <motion.h2
              className="dash-section-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: dur.base, delay: 0.1 }}
            >
              Overview
            </motion.h2>

            {loading ? (
              <LoadingState label="Loading overview…" />
            ) : error ? (
              <div className="dash-overview-error" role="alert">
                <p>{error}</p>
                <button type="button" className="dash-retry" onClick={load}>Try Again</button>
              </div>
            ) : (
              <>
                {/* Account status */}
                <div className="dash-status">
                  <span className="dash-chip">{accountTypeLabel} account</span>
                  <span className={`dash-chip ${profile.emailVerified ? 'dash-chip--ok' : 'dash-chip--warn'}`}>
                    {profile.emailVerified ? 'Email verified' : 'Email unverified'}
                  </span>
                  <span className="dash-chip">{businessLabel}</span>
                </div>

                {/* Listing + featured summary */}
                <div className="dash-stats">
                  {STAT_TILES.map(t => (
                    <div key={t.key} className="dash-stat">
                      <span className={`dash-stat__value${t.accent ? ` dash-stat__value--${t.accent}` : ''}`}>
                        {stats[t.key]}
                      </span>
                      <span className="dash-stat__label">{t.label}</span>
                    </div>
                  ))}
                </div>

                {/* Beta limit usage (active = pending + approved) */}
                <div className="dash-status" style={{ marginTop: 'var(--space-3)' }}>
                  <span className="dash-chip">Personal listings {stats.activePersonal}/2</span>
                  {userType === 'business' && (
                    <span className="dash-chip">Business listings {stats.activeBusiness}/6</span>
                  )}
                  {userType === 'business' && businessStatus === 'approved' && (
                    <span className="dash-chip">Featured slots {stats.featured}/3</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Dashboard cards ─────────────────────────────────────────────── */}
          <div className="dash-section">
            <motion.h2
              className="dash-section-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: dur.base, delay: 0.14 }}
            >
              My Account
            </motion.h2>

            <motion.div
              className="dash-cards"
              variants={staggerContainer(0.06)}
              initial="hidden"
              animate="visible"
            >
              {cards.map(card => (
                <DashCard key={card.title} {...card} />
              ))}
            </motion.div>
          </div>

        </div>
      </main>
    </PageTransition>
  );
}
