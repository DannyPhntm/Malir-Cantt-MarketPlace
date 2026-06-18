import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { tap } from '../animations';
import { useFavorites } from '../context/FavoritesContext';
import { addRecentlyViewed } from '../services/recentlyViewedService';
import VerifiedBadge from './VerifiedBadge';
import './ListingCard.css';

const MotionLink = motion(Link);

// Categories where a photo is optional (see categoryConfig.js). When such a
// listing has no image we render a branded category panel instead of an empty
// image box — keeping the card looking intentional and the grid consistent.
const OPTIONAL_IMAGE_CATEGORIES = ['jobs', 'services'];

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function ServiceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6a1.5 1.5 0 01-2.1-2.1z" />
    </svg>
  );
}

// Branded fallback panel — fills the same 4:3 image slot, so card heights and
// grid alignment stay identical whether or not a listing has a photo.
function ListingPlaceholder({ listing }) {
  const isJob = listing.categorySlug === 'jobs';
  const tagline = isJob ? 'Job Opening' : 'Service';
  // Reuse the data the card already carries: job type / service type.
  const detail = isJob ? listing.condition : listing.serviceType;

  return (
    <div className={`listing-card__placeholder listing-card__placeholder--${isJob ? 'jobs' : 'services'}`}>
      <span className="listing-card__placeholder-tag">{tagline}</span>
      <div className="listing-card__placeholder-icon">
        {isJob ? <BriefcaseIcon /> : <ServiceIcon />}
      </div>
      {detail && <span className="listing-card__placeholder-pill">{detail}</span>}
    </div>
  );
}

export default function ListingCard({ listing, showSeller = false }) {
  const { toggle, isFavorited, setIsOpen } = useFavorites();
  const [popping, setPopping] = useState(false);
  // Track image load failure so a broken/expired URL falls back to a branded
  // panel instead of the browser's broken-image icon.
  const [imgFailed, setImgFailed] = useState(false);
  const favorited = isFavorited(listing.id);
  const showPlaceholder =
    (!listing.image || imgFailed) && OPTIONAL_IMAGE_CATEGORIES.includes(listing.categorySlug);
  const showBrokenFallback = imgFailed && !showPlaceholder;

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!favorited) {
      setPopping(true);
      setTimeout(() => setPopping(false), 600);
    }
    toggle(listing);
  };

  return (
    <MotionLink
      to={`/listing/${listing.id}`}
      className="listing-card"
      whileTap={tap}
      onClick={() => {
        addRecentlyViewed(listing);
        setIsOpen(false);
      }}
    >
      <div className="listing-card__image-wrap">
        {showPlaceholder ? (
          <ListingPlaceholder listing={listing} />
        ) : showBrokenFallback ? (
          <div className="listing-card__placeholder listing-card__placeholder--fallback">
            <div className="listing-card__placeholder-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <span className="listing-card__placeholder-pill">{listing.category}</span>
          </div>
        ) : (
          <img
            src={listing.image}
            alt={listing.title}
            className="listing-card__image"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        )}
        {listing.featured && (
          <span className="listing-card__badge">Featured</span>
        )}
        <button
          className={`listing-card__save ${favorited ? 'listing-card__save--liked' : ''}`}
          aria-label={favorited ? 'Remove from saved' : 'Save listing'}
          onClick={handleSave}
        >
          <svg
            className={popping ? 'heart-pop' : ''}
            viewBox="0 0 24 24"
            fill={favorited ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </div>

      <div className="listing-card__body">
        <p className="listing-card__price">{listing.price}</p>
        <h3 className="listing-card__title">{listing.title}</h3>
        <div className="listing-card__meta">
          <span className="listing-card__category">{listing.category}</span>
          <span className="listing-card__dot" />
          <span className="listing-card__location">{listing.location}</span>
        </div>
        {showSeller && listing.seller?.name && (
          <div className="listing-card__seller">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>{listing.seller.name}</span>
          </div>
        )}
        <div className="listing-card__footer">
          <p className="listing-card__time">{listing.timeAgo}</p>
          {listing.seller?.isVerified && (
            <VerifiedBadge type={listing.seller.badgeType} size="sm" />
          )}
        </div>
      </div>
    </MotionLink>
  );
}
