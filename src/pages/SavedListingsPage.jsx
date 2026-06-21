import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../context/FavoritesContext';
import PageTransition from '../components/PageTransition';
import LoadingState from '../components/LoadingState';
import { staggerContainer, staggerItem, tap, dur, ease } from '../animations';
import './SavedListingsPage.css';

/* ── Icons ───────────────────────────────────────────────────────────────────── */

function HeartFilledIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

function EmptyHeartIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>
    </svg>
  );
}

/* ── Saved listing card ──────────────────────────────────────────────────────── */

function SavedCard({ listing, onRemove }) {
  const sellerName = listing.seller?.name || 'Unknown Seller';

  return (
    <div className="saved-card">
      {/* Image */}
      <div className="saved-card__image-wrap">
        {listing.image ? (
          <img
            src={listing.image}
            alt={listing.title}
            className="saved-card__image"
            loading="lazy"
          />
        ) : (
          <div className="saved-card__image saved-card__image--placeholder" aria-hidden="true"/>
        )}
        {/* Category pill on top of image */}
        <span className="saved-card__cat-pill">{listing.category}</span>
      </div>

      {/* Body */}
      <div className="saved-card__body">
        <p className="saved-card__title">{listing.title}</p>
        <p className="saved-card__price">{listing.price}</p>
        <div className="saved-card__seller">
          <PersonIcon />
          <span>{sellerName}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="saved-card__footer">
        <Link
          to={`/listing/${listing.id}`}
          className="saved-card__view"
        >
          View Listing
          <ArrowRightIcon />
        </Link>
        <motion.button
          type="button"
          className="saved-card__remove"
          onClick={onRemove}
          whileTap={tap}
          title="Remove from saved"
          aria-label={`Remove ${listing.title} from saved listings`}
        >
          <HeartFilledIcon />
        </motion.button>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */

export default function SavedListingsPage() {
  const { favorites, toggle, loading } = useFavorites();
  const count = favorites.length;

  return (
    <PageTransition>
      <main className="saved-page">

        {/* ── Dark header ────────────────────────────────────────────────── */}
        <header className="saved-header">
          <div className="saved-header__inner">
            <div className="saved-header__left">
              <nav className="saved-breadcrumb" aria-label="Breadcrumb">
                <Link to="/dashboard" className="saved-breadcrumb__link">Dashboard</Link>
                <span className="saved-breadcrumb__sep" aria-hidden="true">›</span>
                <span className="saved-breadcrumb__current">Saved Listings</span>
              </nav>
              <h1 className="saved-header__title">Saved Listings</h1>
              <p className="saved-header__sub">
                {count > 0
                  ? `${count} item${count !== 1 ? 's' : ''} saved for later`
                  : 'Items you bookmark will appear here'}
              </p>
            </div>
            {count > 0 && (
              <span className="saved-header__count" aria-live="polite">{count}</span>
            )}
          </div>
        </header>

        <div className="saved-inner">

          {/* ── Loading / empty / grid ──────────────────────────────────── */}
          {loading ? (
            <LoadingState label="Loading saved listings…" />
          ) : count === 0 ? (
            <motion.div
              className="saved-empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.slow, ease: ease.out }}
            >
              <div className="saved-empty__icon">
                <EmptyHeartIcon />
              </div>
              <h2 className="saved-empty__title">You haven't saved any listings yet.</h2>
              <p className="saved-empty__sub">
                Tap the heart icon on any listing to save it here for later.
              </p>
              <Link to="/listings" className="saved-empty__cta">
                Browse Listings
              </Link>
            </motion.div>
          ) : (
            /* ── Card grid ──────────────────────────────────────────────── */
            <motion.div
              className="saved-grid"
              variants={staggerContainer(0.05)}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {favorites.map(listing => (
                  <motion.div
                    key={listing.id}
                    className="saved-grid__item"
                    variants={staggerItem}
                    layout
                    exit={{
                      opacity: 0,
                      scale: 0.88,
                      transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
                    }}
                  >
                    <SavedCard
                      listing={listing}
                      onRemove={() => toggle(listing)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </main>
    </PageTransition>
  );
}
