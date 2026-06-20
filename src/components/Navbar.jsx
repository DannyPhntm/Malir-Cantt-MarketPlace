import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { navMenu } from '../animations';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Browse',     to: '/listings' },
  { label: 'Categories', dropdown: true },
  { label: 'Listings',   to: '/listings' },
  { label: 'About',      to: '/about' },
  { label: 'Contact',    to: '/contact' },
];

const DROPDOWN_CATEGORIES = [
  { slug: 'vehicles',   name: 'Vehicles' },
  { slug: 'technology', name: 'Technology' },
  { slug: 'property',   name: 'Property' },
  { slug: 'furniture',  name: 'Furniture' },
  { slug: 'jobs',       name: 'Jobs' },
  { slug: 'services',   name: 'Services' },
  { slug: 'gym',        name: 'Gym & Fitness' },
  { slug: 'shoes',      name: 'Shoes & Footwear' },
  { slug: 'food',       name: 'Food & Home Kitchen' },
];

// Account dropdown destinations (shown when signed in).
const ACCOUNT_LINKS = [
  { label: 'My Profile',     to: '/profile' },
  { label: 'My Listings',    to: '/my-listings' },
  { label: 'Saved Listings', to: '/saved-listings' },
  { label: 'Dashboard',      to: '/dashboard' },
];

function initialsOf(name) {
  return (name || 'U')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Avatar — photo when set, otherwise initials on a brand-green tile.
function Avatar({ name, src, className = '' }) {
  return (
    <span className={`navbar__avatar${className ? ' ' + className : ''}`} aria-hidden="true">
      {src
        ? <img className="navbar__avatar-img" src={src} alt="" />
        : <span className="navbar__avatar-initials">{initialsOf(name)}</span>}
    </span>
  );
}

const dropdownAnim = {
  initial:  { opacity: 0, y: -8, scale: 0.97 },
  animate:  { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } },
  exit:     { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } },
};

const mobileCatsAnim = {
  initial:  { opacity: 0, height: 0 },
  animate:  { opacity: 1, height: 'auto', transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  exit:     { opacity: 0, height: 0, transition: { duration: 0.14 } },
};

export default function Navbar() {
  const [menuOpen, setMenuOpen]           = useState(false);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [accountOpen, setAccountOpen]     = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [mobileQuery, setMobileQuery]     = useState('');
  const dropdownRef  = useRef(null);
  const accountRef   = useRef(null);
  const { favorites, setIsOpen } = useFavorites();
  const { isAuthenticated, logout, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    closeMenu();
    navigate('/');
  };

  // Pre-fill the mobile search from the current URL when the mobile menu opens.
  useEffect(() => {
    if (menuOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync the input to the current URL when the panel opens
      setMobileQuery(new URLSearchParams(location.search).get('q') || '');
    }
  }, [menuOpen, location.search]);

  const closeMenu = () => {
    setMenuOpen(false);
    setMobileCatsOpen(false);
  };

  // Close the category + account dropdowns on outside click
  useEffect(() => {
    if (!dropdownOpen && !accountOpen) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen, accountOpen]);

  // Close dropdowns on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setAccountOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleMobileSearchSubmit = (e) => {
    e.preventDefault();
    const q = mobileQuery.trim();
    navigate(q ? `/listings?q=${encodeURIComponent(q)}` : '/listings');
    closeMenu();
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        {/* Brand — checkpost icon + wordmark */}
        <Link to="/" className="navbar__brand" aria-label="People of Malir Cantt Bazaar Home">
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
            <span className="navbar__wordmark-primary">People of Malir Cantt</span>
            <span className="navbar__wordmark-secondary">BAZAAR</span>
          </div>
        </Link>

        {/* Center navigation */}
        <nav className="navbar__nav" aria-label="Main navigation">
          {NAV_LINKS.map(link => {
            if (link.dropdown) {
              return (
                <div className="navbar__dropdown-wrap" key="categories" ref={dropdownRef}>
                  <button
                    className={`navbar__nav-link navbar__dropdown-trigger${dropdownOpen ? ' navbar__dropdown-trigger--open' : ''}`}
                    onClick={() => setDropdownOpen(v => !v)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="listbox"
                  >
                    {link.label}
                    <svg className="navbar__dropdown-chevron" width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div className="navbar__dropdown" role="listbox" {...dropdownAnim}>
                        <div className="navbar__dropdown-list">
                          {DROPDOWN_CATEGORIES.map(cat => (
                            <Link
                              key={cat.slug}
                              to={`/category/${cat.slug}`}
                              className="navbar__dropdown-item"
                              onClick={() => setDropdownOpen(false)}
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                        <div className="navbar__dropdown-footer">
                          <Link
                            to="/listings"
                            className="navbar__dropdown-footer-link"
                            onClick={() => setDropdownOpen(false)}
                          >
                            Browse all listings →
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <NavLink
                key={link.to + link.label}
                to={link.to}
                className={({ isActive }) =>
                  `navbar__nav-link${isActive ? ' navbar__nav-link--active' : ''}`
                }
              >
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="navbar__actions">
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

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `navbar__join-btn${isActive ? ' navbar__join-btn--active' : ''}`}
            >
              Admin
            </NavLink>
          )}
          {isAuthenticated ? (
            <div className="navbar__account-wrap" ref={accountRef}>
              <button
                className={`navbar__account-trigger${accountOpen ? ' navbar__account-trigger--open' : ''}`}
                onClick={() => setAccountOpen(v => !v)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
              >
                <Avatar name={user?.name} src={user?.avatarUrl} />
                <svg className="navbar__account-chevron" width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <motion.div className="navbar__account-menu" role="menu" {...dropdownAnim}>
                    <div className="navbar__account-head">
                      <Avatar name={user?.name} src={user?.avatarUrl} className="navbar__avatar--lg" />
                      <div className="navbar__account-id">
                        <span className="navbar__account-name">{user?.name}</span>
                        <span className="navbar__account-email">{user?.email}</span>
                      </div>
                    </div>
                    <div className="navbar__account-list">
                      {ACCOUNT_LINKS.map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          role="menuitem"
                          className="navbar__account-item"
                          onClick={() => setAccountOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="navbar__account-item navbar__account-logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/login" className="navbar__join-btn">Login</Link>
              <Link to="/login?register=1" className="navbar__join-btn navbar__join-btn--accent">Register</Link>
            </>
          )}
          <Link to="/add-listing" className="navbar__cta">+ Add Listing</Link>
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
            {/* Mobile search */}
            <form className="navbar__mobile-search-form" onSubmit={handleMobileSearchSubmit} role="search">
              <div className="navbar__mobile-search-wrap">
                <span className="navbar__mobile-search-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </span>
                <input
                  className="navbar__mobile-search-input"
                  type="search"
                  placeholder="Search listings…"
                  value={mobileQuery}
                  onChange={e => setMobileQuery(e.target.value)}
                  aria-label="Search listings"
                  autoComplete="off"
                />
              </div>
            </form>
            <div className="navbar__mobile-divider" />

            {NAV_LINKS.map(link => {
              if (link.dropdown) {
                return (
                  <div key="categories-mobile">
                    <button
                      className={`navbar__mobile-link navbar__mobile-cat-toggle${mobileCatsOpen ? ' navbar__mobile-cat-toggle--open' : ''}`}
                      onClick={() => setMobileCatsOpen(v => !v)}
                      aria-expanded={mobileCatsOpen}
                    >
                      Categories
                      <svg className="navbar__mobile-cat-chevron" width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <AnimatePresence>
                      {mobileCatsOpen && (
                        <motion.div className="navbar__mobile-cats" {...mobileCatsAnim}>
                          {DROPDOWN_CATEGORIES.map(cat => (
                            <Link
                              key={cat.slug}
                              to={`/category/${cat.slug}`}
                              className="navbar__mobile-cat-item"
                              onClick={closeMenu}
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <NavLink
                  key={link.to + link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    `navbar__mobile-link${isActive ? ' navbar__mobile-link--active' : ''}`
                  }
                  onClick={closeMenu}
                >
                  {link.label}
                </NavLink>
              );
            })}
            <div className="navbar__mobile-divider" />

            {isAuthenticated && (
              <>
                <div className="navbar__mobile-account-head">
                  <Avatar name={user?.name} src={user?.avatarUrl} className="navbar__avatar--lg" />
                  <div className="navbar__account-id">
                    <span className="navbar__account-name">{user?.name}</span>
                    <span className="navbar__account-email">{user?.email}</span>
                  </div>
                </div>
                <Link to="/profile"     className="navbar__mobile-link" onClick={closeMenu}>My Profile</Link>
                <Link to="/my-listings" className="navbar__mobile-link" onClick={closeMenu}>My Listings</Link>
                <Link to="/dashboard"   className="navbar__mobile-link" onClick={closeMenu}>Dashboard</Link>
              </>
            )}

            <button
              className="navbar__mobile-link navbar__mobile-fav"
              onClick={() => { closeMenu(); setIsOpen(true); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={favorites.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
              </svg>
              Saved Listings
              {favorites.length > 0 && (
                <span className="navbar__fav-badge navbar__fav-badge--mobile">{favorites.length}</span>
              )}
            </button>
            {isAdmin && (
              <Link to="/admin" className="navbar__join-btn navbar__join-btn--full" onClick={closeMenu}>Admin</Link>
            )}
            {isAuthenticated ? (
              <button type="button" className="navbar__join-btn navbar__join-btn--full" onClick={handleLogout}>Logout</button>
            ) : (
              <>
                <Link to="/login" className="navbar__join-btn navbar__join-btn--full" onClick={closeMenu}>Login</Link>
                <Link to="/login?register=1" className="navbar__join-btn navbar__join-btn--full navbar__join-btn--accent" onClick={closeMenu}>Register</Link>
              </>
            )}
            <Link to="/add-listing" className="navbar__cta navbar__cta--full"           onClick={closeMenu}>+ Add Listing</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
