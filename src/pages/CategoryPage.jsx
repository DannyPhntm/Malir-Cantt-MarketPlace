import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useListings } from '../context/ListingsContext';
import ListingCard from '../components/ListingCard';
import LoadingState from '../components/LoadingState';
import PageTransition from '../components/PageTransition';
import { staggerContainer, staggerItem } from '../animations';
import './CategoryPage.css';

const CATEGORY_META = {
  vehicles:      { name: 'Vehicles',      description: 'Cars, bikes, auto parts, and accessories' },
  property:      { name: 'Property',      description: 'Houses, apartments, plots, and rentals' },
  electronics:   { name: 'Electronics',   description: 'Phones, laptops, gaming, and appliances' },
  'home-living': { name: 'Home & Living', description: 'Furniture, home decor, kitchen, garden, and household items' },
  fashion:       { name: 'Fashion',       description: 'Shoes, clothing, and accessories' },
  services:      { name: 'Services',      description: 'Tutors, repair, freelance, cleaning, and professionals' },
  food:          { name: 'Food',          description: 'Home food, baking, catering, and meal prep' },
  jobs:          { name: 'Jobs',          description: 'Full-time, part-time, and internship opportunities' },
  fitness:       { name: 'Fitness',       description: 'Equipment, memberships, supplements, and activewear' },
  other:         { name: 'Other',         description: 'Everything else on the marketplace' },
};

const SORT_OPTIONS = [
  { value: 'newest',         label: 'Newest' },
  { value: 'oldest',         label: 'Oldest' },
  { value: 'price_asc',      label: 'Price: Low to High' },
  { value: 'price_desc',     label: 'Price: High to Low' },
  { value: 'popular',        label: 'Most Popular' },
  { value: 'recently_added', label: 'Recently Added' },
];

function parseTimeAgo(str = '') {
  const m = str.match(/^(\d+)\s*(minute|hour|day)/i);
  if (!m) return Infinity;
  const n = parseInt(m[1]);
  const u = m[2][0].toLowerCase();
  if (u === 'm') return n;
  if (u === 'h') return n * 60;
  return n * 60 * 24;
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [sort, setSort] = useState('newest');
  const { allListings, loading, error, refresh } = useListings();

  const meta = CATEGORY_META[slug] || { name: slug, description: 'Listings in this category' };
  const base = allListings.filter(l => l.categorySlug === slug);

  const sorted = [...base].sort((a, b) => {
    if (sort === 'newest')         return b.id - a.id;
    if (sort === 'oldest')         return a.id - b.id;
    if (sort === 'price_asc')      return a.priceRaw - b.priceRaw;
    if (sort === 'price_desc')     return b.priceRaw - a.priceRaw;
    if (sort === 'popular')        return b.views - a.views;
    if (sort === 'recently_added') return parseTimeAgo(a.timeAgo) - parseTimeAgo(b.timeAgo);
    return 0;
  });

  return (
    <PageTransition>
      <main className="cat-page">

        {/* ── Category header ── */}
        <div className="cat-hero">
          <div className="cat-hero__inner">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="breadcrumb__link">Home</Link>
              <span className="breadcrumb__sep" aria-hidden="true">/</span>
              <span className="breadcrumb__current">{meta.name}</span>
            </nav>
            <h1 className="cat-hero__title">{meta.name}</h1>
            <p className="cat-hero__desc">{meta.description} in Malir Cantt</p>
            <span className="cat-hero__count">
              {base.length} {base.length === 1 ? 'listing' : 'listings'}
            </span>
          </div>
        </div>

        {/* ── Listings ── */}
        <div className="cat-content">
          <div className="cat-content__inner">

            {/* Toolbar */}
            <div className="cat-toolbar">
              <p className="cat-toolbar__results">
                Showing <strong>{sorted.length}</strong> {sorted.length === 1 ? 'listing' : 'listings'}
              </p>
              <div className="cat-toolbar__sort">
                <label htmlFor="cat-sort" className="cat-toolbar__sort-label">Sort by</label>
                <div className="cat-toolbar__select-wrap">
                  <select
                    id="cat-sort"
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="cat-toolbar__select"
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <svg className="cat-toolbar__select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Loading / error / grid / empty */}
            {loading ? (
              <LoadingState label="Loading listings…" />
            ) : error ? (
              <div className="cat-empty">
                <div className="cat-empty__icon" aria-hidden="true">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h2 className="cat-empty__heading">Couldn't load listings</h2>
                <p className="cat-empty__text">{error}</p>
                <button className="cat-empty__cta" onClick={refresh}>Try Again</button>
              </div>
            ) : sorted.length === 0 ? (
              <div className="cat-empty">
                <div className="cat-empty__icon" aria-hidden="true">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <h2 className="cat-empty__heading">No listings yet</h2>
                <p className="cat-empty__text">Be the first to post in {meta.name}.</p>
                <Link to="/add-listing" className="cat-empty__cta">+ Post a Listing</Link>
              </div>
            ) : (
              <motion.div
                className="cat-grid"
                variants={staggerContainer(0.05)}
                initial="hidden"
                animate="visible"
              >
                {sorted.map(listing => (
                  <motion.div key={listing.id} variants={staggerItem}>
                    <ListingCard listing={listing} />
                  </motion.div>
                ))}
              </motion.div>
            )}

          </div>
        </div>

      </main>
    </PageTransition>
  );
}
