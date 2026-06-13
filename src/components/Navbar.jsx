import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navMenu } from '../animations';
import { useFavorites } from '../context/FavoritesContext';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Browse', href: '/browse' },
  { label: 'Categories', href: '/categories' },
  { label: 'Listings', href: '/listings' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { favorites, setIsOpen } = useFavorites();

  return (
    <header className="navbar">
      <div className="navbar__inner">
        {/* Brand — checkpost icon + wordmark */}
        <a href="/" className="navbar__brand" aria-label="Malir Cantt Marketplace Home">
          <div className="navbar__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="21" x2="5" y2="5" />
              <line x1="2" y1="21" x2="8" y2="21" />
              <rect x="3.5" y="8" width="3" height="3.5" rx="0.6" />
              <line x1="6.5" y1="9.5" x2="22" y2="6.2" />
              <line x1="3.5" y1="9.5" x2="2" y2="12.5" />
              <line x1="11" y1="9" x2="11.7" y2="7.4" />
              <line x1="16" y1="8.1" x2="16.7" y2="6.5" />
            </svg>
          </div>
          <div className="navbar__wordmark">
            <span className="navbar__wordmark-primary">MALIR CANTT</span>
            <span className="navbar__wordmark-secondary">MARKETPLACE</span>
          </div>
        </a>

        {/* Center navigation */}
        <nav className="navbar__nav" aria-label="Main navigation">
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} className="navbar__nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="navbar__actions">
          {/* Saved listings */}
          <button
            className="navbar__fav-btn"
            onClick={() => setIsOpen(true)}
            aria-label={`Saved listings${favorites.length > 0 ? ` (${favorites.length})` : ''}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill={favorites.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
            </svg>
            {favorites.length > 0 && (
              <span className="navbar__fav-badge">{favorites.length}</span>
            )}
          </button>

          <a href="/login" className="navbar__join-btn">Join / Login</a>
          <a href="/add-listing" className="navbar__cta">+ Add Listing</a>
        </div>

        {/* Mobile burger */}
        <button
          className="navbar__burger"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`navbar__burger-line ${menuOpen ? 'open' : ''}`} />
          <span className={`navbar__burger-line ${menuOpen ? 'open' : ''}`} />
          <span className={`navbar__burger-line ${menuOpen ? 'open' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div className="navbar__mobile-menu" {...navMenu}>
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className="navbar__mobile-link">{link.label}</a>
            ))}
            <div className="navbar__mobile-divider" />
            <button
              className="navbar__mobile-link navbar__mobile-fav"
              onClick={() => { setMenuOpen(false); setIsOpen(true); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={favorites.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
              </svg>
              Saved Listings
              {favorites.length > 0 && (
                <span className="navbar__fav-badge navbar__fav-badge--mobile">{favorites.length}</span>
              )}
            </button>
            <a href="/login" className="navbar__join-btn navbar__join-btn--full">Join / Login</a>
            <a href="/add-listing" className="navbar__cta navbar__cta--full">+ Add Listing</a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
