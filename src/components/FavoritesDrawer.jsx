import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../context/FavoritesContext';
import ListingCard from './ListingCard';
import './FavoritesDrawer.css';

export default function FavoritesDrawer() {
  const { favorites, isOpen, setIsOpen } = useFavorites();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fav-drawer__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setIsOpen(false)}
          />

          <motion.aside
            className="fav-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Saved listings"
            role="complementary"
          >
            <div className="fav-drawer__header">
              <div className="fav-drawer__title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                </svg>
                Saved Listings
                {favorites.length > 0 && (
                  <span className="fav-drawer__count">{favorites.length}</span>
                )}
              </div>
              <button
                className="fav-drawer__close"
                onClick={() => setIsOpen(false)}
                aria-label="Close saved listings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="fav-drawer__body">
              {favorites.length === 0 ? (
                <div className="fav-drawer__empty">
                  <div className="fav-drawer__empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </div>
                  <p className="fav-drawer__empty-title">No saved listings yet</p>
                  <p className="fav-drawer__empty-hint">
                    Tap the heart icon on any listing to save it here.
                  </p>
                </div>
              ) : (
                <div className="fav-drawer__grid">
                  {favorites.map(listing => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
