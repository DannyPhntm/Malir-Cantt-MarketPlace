import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import LoadingState from '../components/LoadingState';
import listingsApi from '../services/listingsApi';
import { adaptListing } from '../services/listingAdapter';
import { staggerContainer, staggerItem, dur, ease } from '../animations';
import './MyListingsPage.css';

const STATUS_FILTERS = ['All', 'Active', 'Sold', 'Hidden'];
// Filter label → backend status. ("Active" = an approved, live listing.)
const FILTER_STATUS = { Active: 'approved', Sold: 'sold', Hidden: 'hidden' };

/* ── Icons ───────────────────────────────────────────────────────────────────── */

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

/* ── Status badge ────────────────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const labels = {
    approved: 'Active',
    pending: 'Pending',
    rejected: 'Rejected',
    sold: 'Sold',
    hidden: 'Hidden',
  };
  return (
    <span className={`myl-status myl-status--${status}`}>{labels[status] || status}</span>
  );
}

/* ── Listing management card ─────────────────────────────────────────────────── */

function ListingCard({ listing, onStatusChange, onDelete, busy }) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    onDelete(listing.id);
    setConfirming(false);
  };

  return (
    <motion.article
      className={`myl-card myl-card--${listing.status}`}
      variants={staggerItem}
      layout
    >
      {/* Thumbnail */}
      <img
        src={listing.image}
        alt={listing.title}
        className="myl-card__image"
        loading="lazy"
      />

      {/* Body */}
      <div className="myl-card__body">
        <div className="myl-card__top">
          {/* Left: title + meta */}
          <div className="myl-card__info">
            <p className="myl-card__title">{listing.title}</p>
            <div className="myl-card__meta">
              <span className="myl-card__category">{listing.category}</span>
              <span className="myl-meta-sep" aria-hidden="true">·</span>
              <span className="myl-card__views">
                <EyeIcon /> {listing.views} views
              </span>
              <span className="myl-meta-sep" aria-hidden="true">·</span>
              <span className="myl-card__time">{listing.timeAgo}</span>
            </div>
          </div>

          {/* Right: price + status */}
          <div className="myl-card__aside">
            <p className="myl-card__price">{listing.price}</p>
            <StatusBadge status={listing.status} />
          </div>
        </div>

        {/* Action row */}
        <div className="myl-card__actions">
          {/* Edit — links to add-listing until a dedicated edit page exists */}
          <Link to="/add-listing" className="myl-action myl-action--muted">
            Edit
          </Link>

          <span className="myl-action-sep" aria-hidden="true"/>

          {/* Status transitions */}
          {listing.status === 'approved' && (
            <>
              <button
                className="myl-action myl-action--primary"
                disabled={busy}
                onClick={() => onStatusChange(listing.id, 'sold')}
              >
                Mark as Sold
              </button>
              <button
                className="myl-action myl-action--muted"
                disabled={busy}
                onClick={() => onStatusChange(listing.id, 'hidden')}
              >
                Hide Listing
              </button>
            </>
          )}

          {listing.status === 'sold' && (
            <button
              className="myl-action myl-action--primary"
              disabled={busy}
              onClick={() => onStatusChange(listing.id, 'approved')}
            >
              Re-activate
            </button>
          )}

          {listing.status === 'hidden' && (
            <button
              className="myl-action myl-action--primary"
              disabled={busy}
              onClick={() => onStatusChange(listing.id, 'approved')}
            >
              Make Active
            </button>
          )}

          {(listing.status === 'pending' || listing.status === 'rejected') && (
            <span className="myl-action myl-action--muted" aria-disabled="true">
              {listing.status === 'pending' ? 'Awaiting review' : 'Not approved'}
            </span>
          )}

          <span className="myl-action-sep" aria-hidden="true"/>

          {/* Delete with inline confirm */}
          {confirming ? (
            <>
              <button
                className="myl-action myl-action--confirm"
                disabled={busy}
                onClick={handleDelete}
              >
                Confirm Delete
              </button>
              <button
                className="myl-action myl-action--muted"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="myl-action myl-action--danger"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */

export default function MyListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [busyId, setBusyId]     = useState(null);
  const [filter, setFilter]     = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listingsApi.mine();
      setListings(res.listings.map(adaptListing));
    } catch (e) {
      setError(e?.message || 'Could not load your listings.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total:  listings.length,
    active: listings.filter(l => l.status === 'approved').length,
    sold:   listings.filter(l => l.status === 'sold').length,
    hidden: listings.filter(l => l.status === 'hidden').length,
  }), [listings]);

  const filtered = useMemo(() => (
    filter === 'All'
      ? listings
      : listings.filter(l => l.status === FILTER_STATUS[filter])
  ), [listings, filter]);

  const filterCount = (f) => {
    if (f === 'All')    return listings.length;
    if (f === 'Active') return stats.active;
    if (f === 'Sold')   return stats.sold;
    if (f === 'Hidden') return stats.hidden;
    return 0;
  };

  // Optimistic status change — reverts on failure.
  const handleStatusChange = async (id, status) => {
    const snapshot = listings;
    setBusyId(id);
    setError(null);
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    try {
      await listingsApi.update(id, { status });
    } catch (e) {
      setListings(snapshot);
      setError(e?.message || 'Could not update the listing.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    const snapshot = listings;
    setBusyId(id);
    setError(null);
    setListings(prev => prev.filter(l => l.id !== id));
    try {
      await listingsApi.remove(id);
    } catch (e) {
      setListings(snapshot);
      setError(e?.message || 'Could not delete the listing.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageTransition>
      <main className="myl-page">

        {/* ── Dark header ────────────────────────────────────────────────── */}
        <header className="myl-header">
          <div className="myl-header__inner">
            <div className="myl-header__left">
              <nav className="myl-breadcrumb" aria-label="Breadcrumb">
                <Link to="/dashboard" className="myl-breadcrumb__link">Dashboard</Link>
                <span className="myl-breadcrumb__sep" aria-hidden="true">›</span>
                <span className="myl-breadcrumb__current">My Listings</span>
              </nav>
              <h1 className="myl-header__title">My Listings</h1>
              <p className="myl-header__sub">Manage and track your posts</p>
            </div>
            <Link to="/add-listing" className="myl-header__cta">
              <PlusIcon />
              Post New Listing
            </Link>
          </div>
        </header>

        <div className="myl-inner">

          {/* ── Stats strip ────────────────────────────────────────────── */}
          <motion.div
            className="myl-stats"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur.slow, ease: ease.out, delay: 0.04 }}
          >
            <div className="myl-stat">
              <p className="myl-stat__value myl-stat__value--total">{stats.total}</p>
              <p className="myl-stat__label">Total Listings</p>
            </div>
            <div className="myl-stat-divider" aria-hidden="true"/>
            <div className="myl-stat">
              <p className="myl-stat__value myl-stat__value--active">{stats.active}</p>
              <p className="myl-stat__label">Active</p>
            </div>
            <div className="myl-stat-divider" aria-hidden="true"/>
            <div className="myl-stat">
              <p className="myl-stat__value myl-stat__value--sold">{stats.sold}</p>
              <p className="myl-stat__label">Sold</p>
            </div>
          </motion.div>

          {/* ── Filter tabs ─────────────────────────────────────────────── */}
          <motion.div
            className="myl-filters"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: dur.base, delay: 0.12 }}
            role="tablist"
            aria-label="Filter listings by status"
          >
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                className={`myl-filter${filter === f ? ' myl-filter--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
                <span className="myl-filter__count">{filterCount(f)}</span>
              </button>
            ))}
          </motion.div>

          {error && <p className="myl-error" role="alert">{error}</p>}

          {/* ── Listings ────────────────────────────────────────────────── */}
          {loading ? (
            <LoadingState label="Loading your listings…" />
          ) : filtered.length === 0 ? (
            <motion.div
              className="myl-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: dur.base }}
            >
              <div className="myl-empty__icon"><EmptyIcon /></div>
              <p className="myl-empty__title">
                No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}listings
              </p>
              <p className="myl-empty__sub">
                {filter === 'All'
                  ? "You haven't posted any listings yet."
                  : `You don't have any ${filter.toLowerCase()} listings.`}
              </p>
              {filter === 'All' && (
                <Link to="/add-listing" className="myl-empty__cta">
                  Post your first listing →
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div
              className="myl-listings"
              variants={staggerContainer(0.07)}
              initial="hidden"
              animate="visible"
            >
              {filtered.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  busy={busyId === listing.id}
                />
              ))}
            </motion.div>
          )}

        </div>
      </main>
    </PageTransition>
  );
}
