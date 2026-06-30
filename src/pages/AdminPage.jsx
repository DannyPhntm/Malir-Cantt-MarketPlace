import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import LoadingState from '../components/LoadingState';
import adminApi from '../services/adminApi';
import shopsApi from '../services/shopsApi';
import { adaptListing } from '../services/listingAdapter';
import { SHOP_CATEGORY_LABEL } from '../data/shopConfig';
import './AdminPage.css';

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 10 8 10 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <path d="M1 1l22 22M6.61 6.61A18.5 18.5 0 002 12s3 8 10 8a9.12 9.12 0 005.39-1.61" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

// Status → badge label/variant for the listing rows.
const STATUS_LABEL = {
  pending: 'Pending', approved: 'Active', rejected: 'Rejected', sold: 'Sold', hidden: 'Hidden',
};

const LISTING_FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'hidden', label: 'Hidden' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('listings'); // 'listings' | 'featured' | 'business' | 'users'
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [listingFilter, setListingFilter] = useState('pending');
  const [listingsLoading, setListingsLoading] = useState(false);
  const [featuredReqs, setFeaturedReqs] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [flash, setFlash] = useState('');

  // Core data (everything except the status-filtered listing list).
  const loadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sres, fres, bresPending, bresApproved, ures, shres] = await Promise.all([
        adminApi.getStats(),
        adminApi.listFeaturedRequests(),
        adminApi.listBusinessAccounts('pending'),
        adminApi.listBusinessAccounts('approved'),
        adminApi.listUsers(),
        shopsApi.listAll(),
      ]);
      setStats(sres.stats);
      setFeaturedReqs(fres.listings.map(adaptListing));
      // Show pending applications + approved-but-not-yet-settled accounts (the
      // latter still need a waive/mark-paid to become a live business — otherwise
      // the user is "approved" but businessVerified stays false). Fully-settled
      // businesses aren't shown (nothing actionable).
      const isSettled = (b) => b.paymentStatus === 'paid' || b.paymentStatus === 'waived';
      setBusinesses([
        ...bresPending.businessAccounts,
        ...bresApproved.businessAccounts.filter((b) => !isSettled(b)),
      ]);
      setUsers(ures.users);
      setShops(shres.shops || []);
    } catch (e) {
      setError(e?.message || 'Failed to load the admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: load dashboard data on mount
  useEffect(() => { loadCore(); }, [loadCore]);

  // Listing list re-fetches whenever the status filter changes.
  const loadListings = useCallback(async (status) => {
    setListingsLoading(true);
    try {
      const { listings: rows } = await adminApi.listListings(status);
      setListings(rows.map(adaptListing));
    } catch (e) {
      setError(e?.message || 'Could not load listings.');
    } finally {
      setListingsLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: re-fetch listings when the status filter changes
  useEffect(() => { loadListings(listingFilter); }, [listingFilter, loadListings]);

  const refreshStats = useCallback(async () => {
    try {
      const { stats: s } = await adminApi.getStats();
      setStats(s);
    } catch { /* non-fatal */ }
  }, []);

  const showFlash = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 2600);
  };

  // Listing moderation: remove from whichever list it's in, flash, refresh stats.
  const moderateListing = async (id, body, label, source = 'listings') => {
    setBusyId(`l${id}`);
    setError(null);
    try {
      await adminApi.setListingStatus(id, body);
      if (source === 'featured') setFeaturedReqs((p) => p.filter((l) => l.id !== id));
      else setListings((p) => p.filter((l) => l.id !== id));
      showFlash(label);
      refreshStats();
    } catch (e) {
      setError(e?.message || 'Could not update the listing.');
    } finally {
      setBusyId(null);
    }
  };

  const removeListing = async (id) => {
    if (!window.confirm('Delete this listing permanently? This cannot be undone.')) return;
    setBusyId(`l${id}`);
    setError(null);
    try {
      await adminApi.deleteListing(id);
      setListings((p) => p.filter((l) => l.id !== id));
      setFeaturedReqs((p) => p.filter((l) => l.id !== id));
      showFlash('Listing deleted');
      refreshStats();
    } catch (e) {
      setError(e?.message || 'Could not delete the listing.');
    } finally {
      setBusyId(null);
    }
  };

  // body: { sellerStatus?, paymentStatus? }. `remove` drops the row from the
  // pending queue (approve/reject); payment-only changes keep it and patch in place.
  const decideBusiness = async (id, body, label, remove) => {
    setBusyId(`b${id}`);
    setError(null);
    try {
      const res = await adminApi.decideBusiness(id, body);
      setBusinesses((prev) =>
        remove
          ? prev.filter((b) => b.id !== id)
          : prev.map((b) => (b.id === id ? { ...b, ...res.businessAccount } : b)),
      );
      showFlash(label);
      refreshStats();
    } catch (e) {
      setError(e?.message || 'Could not update the application.');
    } finally {
      setBusyId(null);
    }
  };

  // Shops moderation: action 'approve' | 'hide' | 'delete'.
  const decideShop = async (id, action, label) => {
    setBusyId(`s${id}`);
    setError(null);
    try {
      if (action === 'delete') {
        await shopsApi.remove(id);
        setShops((prev) => prev.filter((s) => s.id !== id));
      } else {
        const res = await shopsApi.setStatus(id, action === 'approve' ? 'approved' : 'hidden');
        setShops((prev) => prev.map((s) => (s.id === id ? res.shop : s)));
      }
      showFlash(label);
    } catch (e) {
      setError(e?.message || 'Could not update the shop.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUserSearch = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const { users: rows } = await adminApi.listUsers(userSearch.trim());
      setUsers(rows);
    } catch (err) {
      setError(err?.message || 'Could not search users.');
    }
  };

  // Per-listing actions depend on the current status.
  const listingActions = (l) => {
    const busy = busyId === `l${l.id}`;
    if (l.status === 'pending') {
      return (
        <>
          <button className="admin__btn admin__btn--approve" disabled={busy}
            onClick={() => moderateListing(l.id, { status: 'approved' }, 'Listing approved')}>
            <CheckIcon /> Approve
          </button>
          {l.featuredRequested && (
            <button className="admin__btn admin__btn--feature" disabled={busy}
              onClick={() => moderateListing(l.id, { status: 'approved', featuredActive: true }, 'Approved & featured')}>
              <StarIcon /> Feature
            </button>
          )}
          <button className="admin__btn admin__btn--reject" disabled={busy}
            onClick={() => moderateListing(l.id, { status: 'rejected' }, 'Listing rejected')}>
            <XIcon /> Reject
          </button>
        </>
      );
    }
    if (l.status === 'hidden') {
      return (
        <>
          <button className="admin__btn admin__btn--approve" disabled={busy}
            onClick={() => moderateListing(l.id, { status: 'approved' }, 'Listing restored')}>
            <RotateIcon /> Restore
          </button>
          <button className="admin__btn admin__btn--delete" disabled={busy}
            onClick={() => removeListing(l.id)}>
            <TrashIcon /> Delete
          </button>
        </>
      );
    }
    // approved (and any other live status)
    return (
      <>
        {l.featuredRequested && !l.featured && (
          <button className="admin__btn admin__btn--feature" disabled={busy}
            onClick={() => moderateListing(l.id, { featuredActive: true }, 'Featured activated')}>
            <StarIcon /> Feature
          </button>
        )}
        <button className="admin__btn admin__btn--hide" disabled={busy}
          onClick={() => moderateListing(l.id, { status: 'hidden' }, 'Listing hidden')}>
          <EyeOffIcon /> Hide
        </button>
        <button className="admin__btn admin__btn--delete" disabled={busy}
          onClick={() => removeListing(l.id)}>
          <TrashIcon /> Delete
        </button>
      </>
    );
  };

  return (
    <PageTransition>
      <main className="admin">
        {/* ── Header ── */}
        <div className="admin__hero">
          <div className="admin__hero-inner">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="breadcrumb__link">Home</Link>
              <span className="breadcrumb__sep" aria-hidden="true">/</span>
              <span className="breadcrumb__current">Admin</span>
            </nav>
            <h1 className="admin__hero-title">Moderation</h1>
            <p className="admin__hero-sub">Review listings, business applications, featured requests, and users.</p>
          </div>
        </div>

        <div className="admin__content">
          <div className="admin__inner">

            {/* Statistics — live backend data */}
            {stats && (
              <div className="admin__stats">
                <div className="admin__stat">
                  <span className="admin__stat-value">{stats.users}</span>
                  <span className="admin__stat-label">Users</span>
                </div>
                <div className="admin__stat">
                  <span className="admin__stat-value">{stats.listings.total}</span>
                  <span className="admin__stat-label">Listings</span>
                </div>
                <div className="admin__stat admin__stat--accent">
                  <span className="admin__stat-value">{stats.listings.pending}</span>
                  <span className="admin__stat-label">Pending</span>
                </div>
                <div className="admin__stat">
                  <span className="admin__stat-value">{stats.listings.approved}</span>
                  <span className="admin__stat-label">Approved</span>
                </div>
                <div className="admin__stat">
                  <span className="admin__stat-value">{stats.listings.rejected}</span>
                  <span className="admin__stat-label">Rejected</span>
                </div>
                <div className="admin__stat">
                  <span className="admin__stat-value">{stats.listings.sold}</span>
                  <span className="admin__stat-label">Sold</span>
                </div>
                <div className="admin__stat">
                  <span className="admin__stat-value">{stats.listings.hidden}</span>
                  <span className="admin__stat-label">Hidden</span>
                </div>
                <div className="admin__stat admin__stat--accent">
                  <span className="admin__stat-value">{stats.business.pending}</span>
                  <span className="admin__stat-label">Business pending</span>
                </div>
                <div className="admin__stat admin__stat--gold">
                  <span className="admin__stat-value">{stats.listings.featuredPending}</span>
                  <span className="admin__stat-label">Featured pending</span>
                </div>
                <div className="admin__stat admin__stat--gold">
                  <span className="admin__stat-value">{stats.listings.featured}</span>
                  <span className="admin__stat-label">Featured active</span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="admin__tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'listings'}
                className={`admin__tab${tab === 'listings' ? ' admin__tab--active' : ''}`}
                onClick={() => setTab('listings')}>
                Listings <span className="admin__tab-count">{listings.length}</span>
              </button>
              <button role="tab" aria-selected={tab === 'featured'}
                className={`admin__tab${tab === 'featured' ? ' admin__tab--active' : ''}`}
                onClick={() => setTab('featured')}>
                Featured <span className="admin__tab-count">{featuredReqs.length}</span>
              </button>
              <button role="tab" aria-selected={tab === 'business'}
                className={`admin__tab${tab === 'business' ? ' admin__tab--active' : ''}`}
                onClick={() => setTab('business')}>
                Business <span className="admin__tab-count">{businesses.length}</span>
              </button>
              <button role="tab" aria-selected={tab === 'users'}
                className={`admin__tab${tab === 'users' ? ' admin__tab--active' : ''}`}
                onClick={() => setTab('users')}>
                Users <span className="admin__tab-count">{users.length}</span>
              </button>
              <button role="tab" aria-selected={tab === 'shops'}
                className={`admin__tab${tab === 'shops' ? ' admin__tab--active' : ''}`}
                onClick={() => setTab('shops')}>
                Shops <span className="admin__tab-count">{shops.length}</span>
              </button>
            </div>

            {/* Flash + error */}
            <AnimatePresence>
              {flash && (
                <motion.div className="admin__flash" role="status"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <CheckIcon /> {flash}
                </motion.div>
              )}
            </AnimatePresence>
            {error && <p className="admin__error" role="alert">{error}</p>}

            {loading ? (
              <LoadingState label="Loading dashboard…" />
            ) : tab === 'listings' ? (
              <>
                {/* Status sub-filter */}
                <div className="admin__subfilter" role="tablist" aria-label="Listing status">
                  {LISTING_FILTERS.map((f) => (
                    <button key={f.key}
                      className={`admin__subfilter-btn${listingFilter === f.key ? ' admin__subfilter-btn--active' : ''}`}
                      aria-selected={listingFilter === f.key}
                      onClick={() => setListingFilter(f.key)}>
                      {f.label}
                    </button>
                  ))}
                </div>
                {listingsLoading ? (
                  <LoadingState label="Loading listings…" />
                ) : listings.length === 0 ? (
                  <div className="admin__empty">No {listingFilter} listings.</div>
                ) : (
                  <ul className="admin__list">
                    {listings.map((l) => (
                      <li key={l.id} className="admin__row">
                        <div className="admin__row-thumb">
                          {l.image
                            ? <img src={l.image} alt="" loading="lazy" />
                            : <span className="admin__row-thumb-empty" aria-hidden="true">{l.category[0]}</span>}
                        </div>
                        <div className="admin__row-main">
                          <div className="admin__row-top">
                            <Link to={`/listing/${l.id}`} className="admin__row-title">{l.title}</Link>
                            <span className="admin__tag">{STATUS_LABEL[l.status] || l.status}</span>
                            <span className={`admin__tag${l.postingType === 'business' ? ' admin__tag--featured' : ''}`}>
                              {l.postingType === 'business' ? 'Business' : 'Personal'}
                            </span>
                            {l.featured && (
                              <span className="admin__tag admin__tag--featured">
                                Featured{l.featuredUntil ? ` · until ${new Date(l.featuredUntil).toLocaleDateString()}` : ''}
                              </span>
                            )}
                            {l.featuredRequested && !l.featured && <span className="admin__tag admin__tag--featured">Featured requested</span>}
                          </div>
                          <div className="admin__row-meta">
                            <span className="admin__row-cat">{l.category}</span>
                            <span className="admin__row-dot" aria-hidden="true" />
                            <span className="admin__row-price">{l.price}</span>
                            <span className="admin__row-dot" aria-hidden="true" />
                            <span>{l.seller.name}</span>
                            {l.postingType === 'business' && l.shop && (
                              <>
                                <span className="admin__row-dot" aria-hidden="true" />
                                <span>Shop: {l.shop.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="admin__row-actions">{listingActions(l)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : tab === 'featured' ? (
              featuredReqs.length === 0 ? (
                <div className="admin__empty">No pending featured requests.</div>
              ) : (
                <ul className="admin__list">
                  {featuredReqs.map((l) => {
                    const busy = busyId === `l${l.id}`;
                    return (
                      <li key={l.id} className="admin__row">
                        <div className="admin__row-thumb">
                          {l.image
                            ? <img src={l.image} alt="" loading="lazy" />
                            : <span className="admin__row-thumb-empty" aria-hidden="true">{l.category[0]}</span>}
                        </div>
                        <div className="admin__row-main">
                          <div className="admin__row-top">
                            <Link to={`/listing/${l.id}`} className="admin__row-title">{l.title}</Link>
                            <span className="admin__tag">{STATUS_LABEL[l.status] || l.status}</span>
                            <span className="admin__tag admin__tag--featured">Featured requested</span>
                          </div>
                          <div className="admin__row-meta">
                            <span className="admin__row-cat">{l.category}</span>
                            <span className="admin__row-dot" aria-hidden="true" />
                            <span className="admin__row-price">{l.price}</span>
                            <span className="admin__row-dot" aria-hidden="true" />
                            <span>{l.seller.name}</span>
                          </div>
                        </div>
                        <div className="admin__row-actions">
                          <button className="admin__btn admin__btn--feature" disabled={busy}
                            onClick={() => moderateListing(l.id, { status: 'approved', featuredActive: true }, 'Featured activated', 'featured')}>
                            <StarIcon /> Activate
                          </button>
                          <button className="admin__btn admin__btn--reject" disabled={busy}
                            onClick={() => moderateListing(l.id, { featuredRequested: false }, 'Featured request rejected', 'featured')}>
                            <XIcon /> Reject
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : tab === 'business' ? (
              businesses.length === 0 ? (
                <div className="admin__empty">No pending business applications.</div>
              ) : (
                <ul className="admin__list">
                  {businesses.map((b) => {
                    const busy = busyId === `b${b.id}`;
                    return (
                      <li key={b.id} className="admin__row">
                        <div className="admin__row-thumb admin__row-thumb--biz" aria-hidden="true">
                          {(b.businessName || '?')[0].toUpperCase()}
                        </div>
                        <div className="admin__row-main">
                          <div className="admin__row-top">
                            <span className="admin__row-title">{b.businessName}</span>
                            <span className="admin__tag">Seller: {b.sellerStatus}</span>
                            <span className="admin__tag">Payment: {b.paymentStatus}</span>
                            {b.businessType && <span className="admin__tag">Type: {b.businessType}</span>}
                          </div>
                          <div className="admin__row-meta">
                            <span>{b.user?.name}</span>
                            <span className="admin__row-dot" aria-hidden="true" />
                            <span>{b.user?.email}</span>
                            {b.businessPhone && (
                              <>
                                <span className="admin__row-dot" aria-hidden="true" />
                                <span>{b.businessPhone}</span>
                              </>
                            )}
                          </div>
                          {b.businessAddress && (
                            <div className="admin__row-meta"><span>{b.businessAddress}</span></div>
                          )}
                          {/* Admin-only verification documents */}
                          {b.verificationDocUrl ? (
                            <div className="admin__docs">
                              <a href={b.verificationDocUrl} target="_blank" rel="noopener noreferrer" className="admin__doc">
                                <img src={b.verificationDocUrl} alt="" className="admin__doc-thumb" loading="lazy" />
                                <span className="admin__doc-cap">{b.verificationDocLabel || 'Verification document'} ↗</span>
                              </a>
                              {b.cnicDocUrl && (
                                <a href={b.cnicDocUrl} target="_blank" rel="noopener noreferrer" className="admin__doc">
                                  <img src={b.cnicDocUrl} alt="" className="admin__doc-thumb" loading="lazy" />
                                  <span className="admin__doc-cap">CNIC ↗</span>
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="admin__row-meta"><span className="admin__row-warn">No verification document</span></div>
                          )}
                          {b.ntnNumber && (
                            <div className="admin__row-meta"><span>NTN: {b.ntnNumber}</span></div>
                          )}
                          {b.adminNotes && (
                            <div className="admin__row-meta"><span>Note: {b.adminNotes}</span></div>
                          )}
                        </div>
                        <div className="admin__row-actions">
                          {b.sellerStatus !== 'approved' && (
                            <>
                              <button className="admin__btn admin__btn--approve" disabled={busy}
                                onClick={() => decideBusiness(b.id, { sellerStatus: 'approved', paymentStatus: b.paymentStatus === 'paid' ? 'paid' : 'waived' }, 'Business Seller approved', true)}>
                                <CheckIcon /> Approve
                              </button>
                              <button className="admin__btn admin__btn--reject" disabled={busy}
                                onClick={() => {
                                  // Optional rejection reason shown to the applicant. Cancel aborts.
                                  const reason = window.prompt('Optional: reason for rejection (shown to the applicant). Leave blank for none, Cancel to abort.');
                                  if (reason === null) return;
                                  const body = { sellerStatus: 'rejected', ...(reason.trim() ? { adminNotes: reason.trim() } : {}) };
                                  decideBusiness(b.id, body, 'Business Seller rejected', true);
                                }}>
                                <XIcon /> Reject
                              </button>
                            </>
                          )}
                          {b.paymentStatus !== 'waived' && (
                            <button className="admin__btn" disabled={busy}
                              onClick={() => decideBusiness(b.id, { paymentStatus: 'waived' }, 'Payment waived', false)}>
                              Waive payment
                            </button>
                          )}
                          {b.paymentStatus !== 'paid' && (
                            <button className="admin__btn" disabled={busy}
                              onClick={() => decideBusiness(b.id, { paymentStatus: 'paid' }, 'Marked paid', false)}>
                              Mark paid
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : tab === 'users' ? (
              /* Users */
              <>
                <form className="admin__search" onSubmit={handleUserSearch} role="search">
                  <input
                    className="admin__search-input"
                    type="search"
                    placeholder="Search users by name or email…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    aria-label="Search users"
                  />
                  <button type="submit" className="admin__btn admin__btn--approve">Search</button>
                </form>
                {users.length === 0 ? (
                  <div className="admin__empty">No users match.</div>
                ) : (
                  <ul className="admin__list">
                    {users.map((u) => (
                      <li key={u.id} className="admin__row">
                        <div className="admin__row-thumb admin__row-thumb--biz" aria-hidden="true">
                          {(u.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="admin__row-main">
                          <div className="admin__row-top">
                            <span className="admin__row-title">{u.name}</span>
                            {u.role === 'admin' && <span className="admin__tag admin__tag--featured">Admin</span>}
                            <span className="admin__tag">{u.accountType === 'business' ? 'Business' : 'Personal'}</span>
                            {u.businessVerified && <span className="admin__tag">Verified business</span>}
                            {u.emailVerified && <span className="admin__tag">Email ✓</span>}
                          </div>
                          <div className="admin__row-meta">
                            <span>{u.email}</span>
                            <span className="admin__row-dot" aria-hidden="true" />
                            <span>{u.phone}</span>
                            <span className="admin__row-dot" aria-hidden="true" />
                            <span>{u._count?.listings ?? 0} listings</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              /* Shops */
              shops.length === 0 ? (
                <div className="admin__empty">No shops yet.</div>
              ) : (
                <ul className="admin__list">
                  {shops.map((s) => {
                    const busy = busyId === `s${s.id}`;
                    return (
                      <li key={s.id} className="admin__row">
                        <div className="admin__row-thumb admin__row-thumb--biz" aria-hidden="true">
                          {s.logoUrl ? <img src={s.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : (s.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="admin__row-main">
                          <div className="admin__row-top">
                            <span className="admin__row-title">{s.name}</span>
                            <span className="admin__tag">{SHOP_CATEGORY_LABEL[s.shopCategory] || s.shopCategory}</span>
                            <span className={`admin__tag${s.status === 'approved' ? ' admin__tag--featured' : ''}`}>{s.status}</span>
                          </div>
                          <div className="admin__row-meta">
                            <span>{s.owner?.businessName || s.owner?.name || '—'}</span>
                            <span className="admin__row-dot" aria-hidden="true" />
                            <span>{s.location}</span>
                          </div>
                        </div>
                        <div className="admin__row-actions">
                          {s.status !== 'approved' && (
                            <button className="admin__btn admin__btn--approve" disabled={busy}
                              onClick={() => decideShop(s.id, 'approve', 'Shop approved')}>Approve</button>
                          )}
                          {s.status === 'approved' && (
                            <button className="admin__btn" disabled={busy}
                              onClick={() => decideShop(s.id, 'hide', 'Shop hidden')}>Hide</button>
                          )}
                          <button className="admin__btn admin__btn--reject" disabled={busy}
                            onClick={() => { if (window.confirm(`Delete shop "${s.name}"?`)) decideShop(s.id, 'delete', 'Shop deleted'); }}>Delete</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            )}

          </div>
        </div>
      </main>
    </PageTransition>
  );
}
