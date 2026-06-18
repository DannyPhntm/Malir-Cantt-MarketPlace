import { Link } from 'react-router-dom';
import { usePublicStats } from '../hooks/usePublicStats';
import './Footer.css';

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-PK') : null);

export default function Footer() {
  const stats = usePublicStats();
  const year = new Date().getFullYear();

  // Real trust signals only — no fabricated numbers.
  const signals = [];
  if (stats) {
    signals.push(`${fmt(stats.activeListings)} active listings`);
    signals.push(`${fmt(stats.verifiedBusinesses)} verified businesses`);
    signals.push(`${stats.categories} categories`);
  }
  signals.push('Local community marketplace');

  return (
    <footer className="footer">
      <div className="footer__inner">

        <div className="footer__top">
          {/* Brand + blurb */}
          <div className="footer__brand">
            <span className="footer__wordmark">People of Malir Cantt <span className="footer__wordmark-accent">BAZAAR</span></span>
            <p className="footer__blurb">
              The community marketplace for Malir Cantt residents. Buy, sell, hire, and discover —
              connect with verified neighbours and local businesses.
            </p>
          </div>

          {/* Link columns */}
          <nav className="footer__cols" aria-label="Footer">
            <div className="footer__col">
              <p className="footer__col-title">Marketplace</p>
              <Link to="/listings" className="footer__link">Browse Listings</Link>
              <Link to="/category/vehicles" className="footer__link">Categories</Link>
              <Link to="/add-listing" className="footer__link">Post a Listing</Link>
            </div>
            <div className="footer__col">
              <p className="footer__col-title">Company</p>
              <Link to="/about" className="footer__link">About</Link>
              <Link to="/contact" className="footer__link">Contact</Link>
              <Link to="/login?register=business" className="footer__link">For Businesses</Link>
            </div>
            <div className="footer__col">
              <p className="footer__col-title">Account</p>
              <Link to="/login" className="footer__link">Sign In</Link>
              <Link to="/dashboard" className="footer__link">Dashboard</Link>
              <Link to="/saved-listings" className="footer__link">Saved Listings</Link>
            </div>
          </nav>
        </div>

        {/* Real trust signals */}
        <div className="footer__signals">
          {signals.map((s, i) => (
            <span key={s} className="footer__signal">
              {i > 0 && <span className="footer__signal-dot" aria-hidden="true">·</span>}
              {s}
            </span>
          ))}
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">© {year} People of Malir Cantt Bazaar. Made for the Malir Cantt community.</p>
          <p className="footer__safety">
            Always meet in a public place and inspect items before paying. Never share OTPs or pay in advance.
          </p>
          <p className="footer__disclaimer">
            Independent community marketplace for Malir Cantt residents. Not officially affiliated with
            any third-party community or social media group.
          </p>
        </div>

      </div>
    </footer>
  );
}
