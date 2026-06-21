import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useListings } from '../context/ListingsContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import listingsApi from '../services/listingsApi';
import Lightbox from '../components/Lightbox';
import VerifiedBadge from '../components/VerifiedBadge';
import PageTransition from '../components/PageTransition';
import RelatedListings from '../components/RelatedListings';
import LoadingState from '../components/LoadingState';
import { handleImgError } from '../lib/imageFallback';
import './ListingDetailPage.css';

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92v2z"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.893c0 2.096.549 4.142 1.595 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.582 0 11.946-5.359 11.949-11.893a11.821 11.821 0 00-3.421-8.452"/>
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

// Owner-facing status labels for the manage panel.
const OWNER_STATUS_LABEL = {
  approved: 'Active', pending: 'Pending review', rejected: 'Rejected', sold: 'Sold', hidden: 'Archived',
};

// Convert a local Pakistani number (e.g. "0300-1234567") into wa.me format (92XXXXXXXXXX)
function toWhatsAppNumber(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('92')) return digits;
  if (digits.startsWith('0')) return '92' + digits.slice(1);
  return '92' + digits;
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { allListings, getListing } = useListings();
  const { user } = useAuth();
  const { isFavorited, toggle } = useFavorites();
  const [listing, setListing] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'notfound'
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeThumb, setActiveThumb] = useState(0);
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [ownerError, setOwnerError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch the listing from the backend by id (works for any status, so an owner
  // can view their own listing immediately after posting).
  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset to the loading state before fetching the listing by id
    setStatus('loading');
    setPhoneRevealed(false);
    setActiveThumb(0);
    getListing(id)
      .then((l) => { if (active) { setListing(l); setStatus(l ? 'ready' : 'notfound'); } })
      .catch(() => { if (active) setStatus('notfound'); });
    return () => { active = false; };
  }, [id, getListing]);

  const handleCopy = async (phone) => {
    try {
      await navigator.clipboard.writeText(phone);
    } catch {
      const el = document.createElement('input');
      el.value = phone;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading') {
    return (
      <PageTransition>
        <main className="detail">
          <LoadingState label="Loading listing…" />
        </main>
      </PageTransition>
    );
  }

  const images = listing ? (listing.images?.length ? listing.images : [listing.image]) : [];
  const isServiceListing = listing && (listing.categorySlug === 'jobs' || listing.categorySlug === 'services');

  if (status === 'notfound' || !listing) {
    return (
      <PageTransition>
        <main className="detail-404">
          <div className="detail-404__inner">
            <div className="detail-404__icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <h1 className="detail-404__heading">Listing not found</h1>
            <p className="detail-404__text">This listing may have been removed or the link is incorrect.</p>
            <Link to="/" className="detail-404__back">← Back to Home</Link>
          </div>
        </main>
      </PageTransition>
    );
  }

  const titleShort = listing.title.length > 44
    ? listing.title.slice(0, 44) + '…'
    : listing.title;

  // ── Seller contact details ──
  const seller = listing.seller;
  const isBusiness = seller.badgeType === 'business';
  const accountType = isBusiness ? 'Business' : 'Personal';
  const BIZ_TYPE_LABELS = {
    'food-beverage': 'Food & Beverage', 'home-decor': 'Home Decor', furniture: 'Furniture',
    electronics: 'Electronics', automotive: 'Automotive', fashion: 'Fashion', fitness: 'Fitness',
    services: 'Services', education: 'Education', beauty: 'Beauty', health: 'Health',
    'real-estate': 'Real Estate', other: 'Other',
  };
  const sellerArea = seller.area || listing.location;
  const whatsAppMessage = `Hi,\n\nI saw your listing for ${listing.title} on People of Malir Cantt Bazaar.\n\nIs this still available?`;
  const whatsAppUrl = `https://wa.me/${toWhatsAppNumber(seller.phone)}?text=${encodeURIComponent(whatsAppMessage)}`;

  // Owner-only controls. Admin moderation lives in the Admin Dashboard, so an
  // admin viewing someone else's listing sees the public (buyer) view here.
  const isOwner = !!(user && listing.userId != null && listing.userId === user.id);
  const saved = isFavorited(listing.id);

  const ownerStatusChange = async (next) => {
    const prev = listing.status;
    setOwnerBusy(true);
    setOwnerError('');
    setListing((l) => ({ ...l, status: next }));
    try {
      await listingsApi.update(listing.id, { status: next });
    } catch (e) {
      setListing((l) => ({ ...l, status: prev }));
      setOwnerError(e?.message || 'Could not update the listing.');
    } finally {
      setOwnerBusy(false);
    }
  };

  const ownerDelete = async () => {
    setOwnerBusy(true);
    setOwnerError('');
    try {
      await listingsApi.remove(listing.id);
      navigate('/my-listings');
    } catch (e) {
      setOwnerError(e?.message || 'Could not delete the listing.');
      setOwnerBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <PageTransition>
      <main className="detail">

        {/* ── Breadcrumb ── */}
        <nav className="detail__breadcrumb-bar" aria-label="Breadcrumb">
          <div className="detail__breadcrumb-inner">
            <Link to="/" className="breadcrumb__link">Home</Link>
            <span className="breadcrumb__sep" aria-hidden="true">/</span>
            <Link to={`/category/${listing.categorySlug}`} className="breadcrumb__link">{listing.category}</Link>
            <span className="breadcrumb__sep" aria-hidden="true">/</span>
            <span className="breadcrumb__current">{titleShort}</span>
          </div>
        </nav>

        {/* ── Main two-column layout ── */}
        <div className="detail__body">
          <div className={`detail__inner${isServiceListing ? ' detail__inner--service' : ''}`}>

            {/* Left: listing details */}
            <article className="detail__main">

              {/* Image gallery — hidden for Jobs / Services */}
              {!isServiceListing && <div className="detail__gallery">
                {/* Main image — click to open lightbox */}
                <div
                  className="detail__image-wrap"
                  onClick={() => { setLightboxIndex(activeThumb); setLightboxOpen(true); }}
                  role="button"
                  tabIndex={0}
                  aria-label="View full size image"
                  onKeyDown={e => e.key === 'Enter' && (setLightboxIndex(activeThumb), setLightboxOpen(true))}
                >
                  {listing.featured && (
                    <span className="detail__featured-badge">Featured</span>
                  )}
                  <img
                    src={images[activeThumb]}
                    alt={listing.title}
                    className="detail__image"
                    onError={handleImgError}
                  />
                  <div className="detail__image-zoom-hint" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      <line x1="11" y1="8" x2="11" y2="14"/>
                      <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                    {images.length > 1 ? `${images.length} photos` : 'Zoom'}
                  </div>
                </div>

                {/* Thumbnail strip — only when multiple images */}
                {images.length > 1 && (
                  <div className="detail__thumbs">
                    {images.map((src, i) => (
                      <button
                        key={i}
                        className={`detail__thumb${i === activeThumb ? ' detail__thumb--active' : ''}`}
                        onClick={() => setActiveThumb(i)}
                        aria-label={`View photo ${i + 1}`}
                        aria-pressed={i === activeThumb}
                      >
                        <img src={src} alt="" loading="lazy" onError={handleImgError} />
                      </button>
                    ))}
                  </div>
                )}
              </div>}

              {/* Meta row */}
              <div className="detail__meta-row">
                <Link to={`/category/${listing.categorySlug}`} className="detail__category-tag">
                  {listing.category}
                </Link>
                <span className="detail__views">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {listing.views.toLocaleString()} views
                </span>
              </div>

              <h1 className="detail__title">{listing.title}</h1>
              <p className="detail__price">{listing.price}</p>

              {/* Location — prominent dedicated row */}
              <div className="detail__location-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{listing.location}</span>
              </div>

              {/* Detail chips — adaptive based on category and whether listing has meta */}
              {isServiceListing ? (
                <>
                  <div className="detail__service-meta">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Posted {listing.timeAgo}
                  </div>
                  {listing.meta?.length > 0 && (
                    <div className="detail__chips">
                      {listing.meta.map(({ label, value }) => (
                        <div key={label} className="detail__chip">
                          <span className="detail__chip-label">{label}</span>
                          <span className="detail__chip-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : listing.meta?.length > 0 ? (
                <div className="detail__chips">
                  {listing.meta.map(({ label, value }) => (
                    <div key={label} className="detail__chip">
                      <span className="detail__chip-label">{label}</span>
                      <span className="detail__chip-value">{value}</span>
                    </div>
                  ))}
                  <div className="detail__chip">
                    <span className="detail__chip-label">Posted</span>
                    <span className="detail__chip-value">{listing.timeAgo}</span>
                  </div>
                </div>
              ) : (
                <div className="detail__chips">
                  {listing.condition && (
                    <div className="detail__chip">
                      <span className="detail__chip-label">Condition</span>
                      <span className="detail__chip-value">{listing.condition}</span>
                    </div>
                  )}
                  <div className="detail__chip">
                    <span className="detail__chip-label">Posted</span>
                    <span className="detail__chip-value">{listing.timeAgo}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              <section className="detail__description">
                <h2 className="detail__description-heading">Description</h2>
                <p className="detail__description-text">{listing.description}</p>
              </section>

            </article>

            {/* Right: seller card (full-width below for service listings) */}
            <aside className={`detail__sidebar${isServiceListing ? ' detail__sidebar--service' : ''}`}>
              <div className="detail__seller-card">

                {/* Seller info */}
                <div className="detail__seller-header">
                  <div className="detail__seller-avatar" aria-hidden="true">
                    {seller.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="detail__seller-info">
                    <p className="detail__seller-name">{seller.name}</p>
                    <div className="detail__seller-badges">
                      <span className={`detail__seller-type${isBusiness ? ' detail__seller-type--business' : ''}`}>
                        {accountType}
                      </span>
                      {isBusiness && seller.businessType && (
                        <span className="detail__seller-type">{BIZ_TYPE_LABELS[seller.businessType] || seller.businessType}</span>
                      )}
                      {seller.isVerified && (
                        <VerifiedBadge type={seller.badgeType} size="md" />
                      )}
                    </div>
                    <Link
                      to={`/seller/${encodeURIComponent(seller.name)}`}
                      className="detail__seller-profile-link"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>

                {/* Seller meta — area + member since */}
                <div className="detail__seller-meta">
                  <div className="detail__seller-meta-row">
                    <MapPinIcon />
                    <span>{sellerArea}</span>
                  </div>
                  <div className="detail__seller-meta-row">
                    <CalendarIcon />
                    <span>Member since {seller.memberSince}</span>
                  </div>
                </div>

                <div className="detail__seller-divider" aria-hidden="true" />

                {isOwner ? (
                  /* ── Owner controls — only the listing owner sees these ── */
                  <div className="detail__owner-actions">
                    <p className="detail__owner-label">Manage your listing</p>
                    <span className={`detail__owner-status detail__owner-status--${listing.status}`}>
                      {OWNER_STATUS_LABEL[listing.status] || listing.status}
                    </span>
                    {ownerError && <p className="detail__owner-error" role="alert">{ownerError}</p>}

                    <Link to={`/edit-listing/${listing.id}`} className="detail__contact-btn detail__owner-btn--edit">
                      Edit Listing
                    </Link>

                    {listing.status === 'approved' && (
                      <>
                        <button className="detail__contact-btn" disabled={ownerBusy} onClick={() => ownerStatusChange('sold')}>
                          Mark as Sold
                        </button>
                        <button className="detail__contact-btn detail__owner-btn--muted" disabled={ownerBusy} onClick={() => ownerStatusChange('hidden')}>
                          Archive Listing
                        </button>
                      </>
                    )}
                    {listing.status === 'sold' && (
                      <button className="detail__contact-btn" disabled={ownerBusy} onClick={() => ownerStatusChange('approved')}>
                        Mark as Available
                      </button>
                    )}
                    {listing.status === 'hidden' && (
                      <button className="detail__contact-btn" disabled={ownerBusy} onClick={() => ownerStatusChange('approved')}>
                        Restore Listing
                      </button>
                    )}
                    {(listing.status === 'pending' || listing.status === 'rejected') && (
                      <p className="detail__owner-note">
                        {listing.status === 'pending' ? 'Awaiting admin review.' : 'Not approved — edit to resubmit for review.'}
                      </p>
                    )}

                    {confirmDelete ? (
                      <div className="detail__owner-confirm">
                        <button className="detail__contact-btn detail__owner-btn--delete" disabled={ownerBusy} onClick={ownerDelete}>
                          Confirm Delete
                        </button>
                        <button className="detail__contact-btn detail__owner-btn--muted" disabled={ownerBusy} onClick={() => setConfirmDelete(false)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="detail__contact-btn detail__owner-btn--delete" disabled={ownerBusy} onClick={() => setConfirmDelete(true)}>
                        Delete Listing
                      </button>
                    )}
                  </div>
                ) : (
                  /* ── Public contact actions — WhatsApp + Call + Save ── */
                  <div className="detail__contact-actions">
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail__contact-btn detail__contact-btn--whatsapp"
                    >
                      <WhatsAppIcon />
                      WhatsApp Seller
                    </a>

                    <AnimatePresence mode="wait" initial={false}>
                      {!phoneRevealed ? (
                        <motion.button
                          key="call-btn"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="detail__contact-btn"
                          onClick={() => setPhoneRevealed(true)}
                        >
                          <PhoneIcon />
                          Call Seller
                        </motion.button>
                      ) : (
                        <motion.div
                          key="phone-revealed"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="detail__phone-wrap"
                        >
                          <p className="detail__phone-label">Seller's number</p>
                          <div className="detail__phone-number">
                            <PhoneIcon />
                            {seller.phone}
                          </div>
                          <div className="detail__phone-actions">
                            <a
                              href={`tel:${seller.phone}`}
                              className="detail__phone-action-btn detail__phone-action-btn--call"
                            >
                              <PhoneIcon /> Call
                            </a>
                            <button
                              className={`detail__phone-action-btn ${copied ? 'detail__phone-action-btn--copied' : 'detail__phone-action-btn--copy'}`}
                              onClick={() => handleCopy(seller.phone)}
                              disabled={copied}
                            >
                              {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      className={`detail__contact-btn detail__contact-btn--save${saved ? ' detail__contact-btn--saved' : ''}`}
                      onClick={() => toggle(listing)}
                      aria-pressed={saved}
                    >
                      <HeartIcon filled={saved} />
                      {saved ? 'Saved' : 'Save Listing'}
                    </button>
                  </div>
                )}

                {/* Safety tip */}
                <div className="detail__safety-tip">
                  <span className="detail__safety-icon" aria-hidden="true"><ShieldIcon /></span>
                  <p>Meet in a public place. Never pay before inspecting the item.</p>
                </div>

              </div>
            </aside>

          </div>
        </div>

        {/* ── You May Also Like — same-category related listings ── */}
        <RelatedListings listing={listing} listings={allListings} />

      </main>

      {/* Lightbox — rendered via portal into document.body */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={images}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>

    </PageTransition>
  );
}
