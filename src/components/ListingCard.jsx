import { useState } from 'react';
import { motion } from 'framer-motion';
import { tap } from '../animations';
import { useFavorites } from '../context/FavoritesContext';
import './ListingCard.css';

const RECENTLY_VIEWED_KEY = 'malir-recently-viewed';

function saveRecentlyViewed(listing) {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    const next = [listing, ...stored.filter(l => l.id !== listing.id)].slice(0, 12);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export default function ListingCard({ listing }) {
  const { toggle, isFavorited } = useFavorites();
  const [popping, setPopping] = useState(false);
  const favorited = isFavorited(listing.id);

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
    <motion.a
      href={`/listing/${listing.id}`}
      className="listing-card"
      whileTap={tap}
      onClick={() => saveRecentlyViewed(listing)}
    >
      <div className="listing-card__image-wrap">
        <img
          src={listing.image}
          alt={listing.title}
          className="listing-card__image"
          loading="lazy"
        />
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
        <p className="listing-card__time">{listing.timeAgo}</p>
      </div>
    </motion.a>
  );
}
