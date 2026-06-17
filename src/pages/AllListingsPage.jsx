import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useListings } from '../context/ListingsContext';
import ListingCard from '../components/ListingCard';
import LoadingState from '../components/LoadingState';
import PageTransition from '../components/PageTransition';
import { staggerContainer, staggerItem } from '../animations';
import './CategoryPage.css';

const SORT_OPTIONS = [
  { value: 'newest',         label: 'Newest' },
  { value: 'oldest',         label: 'Oldest' },
  { value: 'price_asc',      label: 'Price: Low to High' },
  { value: 'price_desc',     label: 'Price: High to Low' },
  { value: 'popular',        label: 'Most Popular' },
  { value: 'recently_added', label: 'Recently Added' },
];

// Converts timeAgo string (e.g. "3 hours ago") to minutes for sort comparison
function parseTimeAgo(str = '') {
  const m = str.match(/^(\d+)\s*(minute|hour|day)/i);
  if (!m) return Infinity;
  const n = parseInt(m[1]);
  const u = m[2][0].toLowerCase();
  if (u === 'm') return n;
  if (u === 'h') return n * 60;
  return n * 60 * 24;
}

const CATEGORY_FILTERS = [
  { value: '',           label: 'All Categories' },
  { value: 'vehicles',   label: 'Vehicles' },
  { value: 'technology', label: 'Technology' },
  { value: 'property',   label: 'Property' },
  { value: 'furniture',  label: 'Furniture' },
  { value: 'jobs',       label: 'Jobs' },
  { value: 'services',   label: 'Services' },
  { value: 'gym',        label: 'Gym & Fitness' },
  { value: 'shoes',      label: 'Shoes & Footwear' },
  { value: 'food',       label: 'Food & Home Kitchen' },
];

// Year list for the vehicle range filter (current year back to 1990).
const NOW_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: NOW_YEAR - 1989 }, (_, i) => String(NOW_YEAR - i));

// Category-specific filters. `key` matches the field name stored in a listing's
// `details`. `type`: 'select' (exact) | 'text' (contains) | 'range' (numeric
// From/To — also the pattern for future price/mileage ranges).
const CAT_FILTER_CONFIG = {
  vehicles: [
    { key: 'year',         label: 'Year',         type: 'range',  options: YEARS },
    { key: 'fuelType',     label: 'Fuel Type',    type: 'select', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'] },
    { key: 'transmission', label: 'Transmission', type: 'select', options: ['Automatic', 'Manual'] },
  ],
  property: [
    { key: 'bedrooms',  label: 'Bedrooms',  type: 'select', options: ['Studio', '1', '2', '3', '4', '5+'] },
    { key: 'bathrooms', label: 'Bathrooms', type: 'select', options: ['1', '2', '3', '4', '5+'] },
  ],
  jobs: [
    { key: 'jobType',    label: 'Job Type',   type: 'select', options: ['Full Time', 'Part Time', 'Contract', 'Internship'] },
    { key: 'experience', label: 'Experience', type: 'select', options: ['Fresher / No Experience', '1 Year', '2 Years', '3–5 Years', '5+ Years'] },
  ],
  services: [
    { key: 'serviceType', label: 'Service Type', type: 'text' },
  ],
  gym: [
    { key: 'equipmentType', label: 'Equipment Type', type: 'text' },
  ],
  shoes: [
    { key: 'size', label: 'Size', type: 'text' },
  ],
  food: [
    { key: 'foodType', label: 'Food Type', type: 'text' },
  ],
};

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="6" x2="20" y2="6"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="11" y1="18" x2="13" y2="18"/>
    </svg>
  );
}

function SelectWrap({ id, value, onChange, children, label }) {
  return (
    <div className="cat-toolbar__sort">
      <label htmlFor={id} className="cat-toolbar__sort-label">{label}</label>
      <div className="cat-toolbar__select-wrap">
        <select id={id} value={value} onChange={onChange} className="cat-toolbar__select">
          {children}
        </select>
        <svg className="cat-toolbar__select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

export default function AllListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort]                 = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priceMin, setPriceMin]         = useState('');
  const [priceMax, setPriceMax]         = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [catFilters, setCatFilters]     = useState({});
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const { allListings, loading, error, refresh }  = useListings();
  const searchInputRef   = useRef(null);

  const urlQuery = searchParams.get('q') || '';
  const [localQuery, setLocalQuery] = useState(urlQuery);
  useEffect(() => { setLocalQuery(urlQuery); }, [urlQuery]);

  // Reset category-specific filters when category changes
  useEffect(() => { setCatFilters({}); }, [categoryFilter]);

  // Autofocus the search box when landing on the page (no scroll jump).
  useEffect(() => { searchInputRef.current?.focus({ preventScroll: true }); }, []);

  const catFilterFields = CAT_FILTER_CONFIG[categoryFilter] || [];
  const activeFilterCount = [priceMin, priceMax, locationFilter, ...Object.values(catFilters)].filter(Boolean).length;

  // The detail value for a field key (details first, legacy direct prop fallback).
  const fieldValue = (listing, key) => listing.details?.[key] ?? listing[key];

  const filtered = useMemo(() => {
    let list = allListings;

    if (localQuery.trim()) {
      // Case-insensitive: every whitespace token must appear somewhere in the
      // listing's searchable text (title, description, category, seller, area,
      // and all category-specific detail values).
      const tokens = localQuery.trim().toLowerCase().split(/\s+/);
      list = list.filter(l => {
        const hay = [
          l.title, l.description, l.category, l.seller?.name, l.location,
          ...Object.values(l.details || {}),
        ].join(' ').toLowerCase();
        return tokens.every(t => hay.includes(t));
      });
    }

    if (categoryFilter) {
      list = list.filter(l => l.categorySlug === categoryFilter);
    }

    const min = parseFloat(String(priceMin).replace(/,/g, ''));
    const max = parseFloat(String(priceMax).replace(/,/g, ''));
    if (priceMin && !isNaN(min)) list = list.filter(l => (l.priceRaw || 0) >= min);
    if (priceMax && !isNaN(max)) list = list.filter(l => (l.priceRaw || 0) <= max);

    if (locationFilter.trim()) {
      const loc = locationFilter.trim().toLowerCase();
      list = list.filter(l => l.location?.toLowerCase().includes(loc));
    }

    // Category-specific filters (typed).
    catFilterFields.forEach(field => {
      if (field.type === 'range') {
        const from = catFilters[`${field.key}From`];
        const to   = catFilters[`${field.key}To`];
        if (from) list = list.filter(l => { const v = parseInt(fieldValue(l, field.key), 10); return !isNaN(v) && v >= parseInt(from, 10); });
        if (to)   list = list.filter(l => { const v = parseInt(fieldValue(l, field.key), 10); return !isNaN(v) && v <= parseInt(to, 10); });
      } else if (field.type === 'text') {
        const val = catFilters[field.key];
        if (val) list = list.filter(l => String(fieldValue(l, field.key) || '').toLowerCase().includes(val.toLowerCase()));
      } else {
        const val = catFilters[field.key];
        if (val) list = list.filter(l => String(fieldValue(l, field.key) || '').toLowerCase() === val.toLowerCase());
      }
    });

    return [...list].sort((a, b) => {
      if (sort === 'newest')         return b.id - a.id;
      if (sort === 'oldest')         return a.id - b.id;
      if (sort === 'price_asc')      return a.priceRaw - b.priceRaw;
      if (sort === 'price_desc')     return b.priceRaw - a.priceRaw;
      if (sort === 'popular')        return b.views - a.views;
      if (sort === 'recently_added') return parseTimeAgo(a.timeAgo) - parseTimeAgo(b.timeAgo);
      return 0;
    });
  }, [sort, categoryFilter, priceMin, priceMax, locationFilter, catFilters, localQuery, allListings]);

  const hasQuery = localQuery.trim().length > 0;
  const heading  = hasQuery ? `Results for "${localQuery.trim()}"` : 'All Listings';
  const description = hasQuery
    ? 'Showing matches across all categories'
    : 'Everything available in Malir Cantt right now';

  const handleSearch = (e) => {
    e.preventDefault();
    const q = localQuery.trim();
    setSearchParams(q ? { q } : {});
  };

  const clearSearch = () => {
    setLocalQuery('');
    setSearchParams({});
    searchInputRef.current?.focus();
  };

  const clearAllFilters = () => {
    setPriceMin(''); setPriceMax(''); setLocationFilter('');
    setCatFilters({});
  };

  // Collect active filter chips (excludes category and sort — already in toolbar)
  const activeChips = useMemo(() => {
    const chips = [];
    if (priceMin) chips.push({
      key: 'priceMin',
      label: `Min: Rs ${Number(String(priceMin).replace(/,/g,'')).toLocaleString()}`,
      clear: () => setPriceMin(''),
    });
    if (priceMax) chips.push({
      key: 'priceMax',
      label: `Max: Rs ${Number(String(priceMax).replace(/,/g,'')).toLocaleString()}`,
      clear: () => setPriceMax(''),
    });
    if (locationFilter.trim()) chips.push({
      key: 'loc',
      label: `Area: ${locationFilter.trim()}`,
      clear: () => setLocationFilter(''),
    });
    const clearCat = (k) => setCatFilters(prev => { const n = { ...prev }; delete n[k]; return n; });
    catFilterFields.forEach(field => {
      if (field.type === 'range') {
        const from = catFilters[`${field.key}From`];
        const to   = catFilters[`${field.key}To`];
        if (from) chips.push({ key: `${field.key}From`, label: `${field.label} from ${from}`, clear: () => clearCat(`${field.key}From`) });
        if (to)   chips.push({ key: `${field.key}To`,   label: `${field.label} to ${to}`,     clear: () => clearCat(`${field.key}To`) });
      } else {
        const value = catFilters[field.key];
        if (value) chips.push({ key: field.key, label: `${field.label}: ${value}`, clear: () => clearCat(field.key) });
      }
    });
    return chips;
  }, [priceMin, priceMax, locationFilter, catFilters, catFilterFields]);

  return (
    <PageTransition>
      <main className="cat-page">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="cat-hero">
          <div className="cat-hero__inner">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="breadcrumb__link">Home</Link>
              <span className="breadcrumb__sep" aria-hidden="true">/</span>
              <span className="breadcrumb__current">Browse</span>
            </nav>
            <h1 className="cat-hero__title">{heading}</h1>
            <p className="cat-hero__desc">{description}</p>

            <form className="cat-search-form" onSubmit={handleSearch} role="search">
              <div className="cat-search-wrap">
                <span className="cat-search-icon"><SearchIcon /></span>
                <input
                  ref={searchInputRef}
                  className="cat-search-input"
                  type="search"
                  value={localQuery}
                  onChange={e => setLocalQuery(e.target.value)}
                  placeholder="Search titles, categories, sellers, areas…"
                  aria-label="Search listings"
                  autoComplete="off"
                />
                {hasQuery && (
                  <button type="button" className="cat-search-clear" onClick={clearSearch} aria-label="Clear search">
                    ×
                  </button>
                )}
              </div>
              <button type="submit" className="cat-search-btn">Search</button>
            </form>

            <span className="cat-hero__count">
              {hasQuery
                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} found`
                : `${allListings.length} active listings`}
            </span>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="cat-content">
          <div className="cat-content__inner">

            {/* Toolbar */}
            <div className="cat-toolbar">
              <p className="cat-toolbar__results">
                Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'listing' : 'listings'}
              </p>
              <div className="cat-toolbar__controls">
                <SelectWrap id="all-cat-filter" label="Category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                  {CATEGORY_FILTERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </SelectWrap>

                <SelectWrap id="all-sort" label="Sort by" value={sort} onChange={e => setSort(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </SelectWrap>

                <button
                  className={`filter-btn${filtersOpen ? ' filter-btn--open' : ''}${activeFilterCount > 0 ? ' filter-btn--active' : ''}`}
                  onClick={() => setFiltersOpen(v => !v)}
                  aria-expanded={filtersOpen}
                >
                  <FilterIcon />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="filter-btn__count">{activeFilterCount}</span>
                  )}
                  <svg
                    className={`filter-btn__chevron${filtersOpen ? ' filter-btn__chevron--open' : ''}`}
                    width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Advanced filter panel */}
            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  className="filter-panel"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="filter-panel__body">
                    <div className="filter-panel__grid">

                      {/* Price range */}
                      <div className="filter-panel__field filter-panel__field--price">
                        <span className="filter-panel__label">Price Range</span>
                        <div className="filter-price-row">
                          <input
                            type="number"
                            className="filter-panel__input"
                            placeholder="Min (Rs)"
                            value={priceMin}
                            onChange={e => setPriceMin(e.target.value)}
                            min="0"
                          />
                          <span className="filter-price-sep">–</span>
                          <input
                            type="number"
                            className="filter-panel__input"
                            placeholder="Max (Rs)"
                            value={priceMax}
                            onChange={e => setPriceMax(e.target.value)}
                            min="0"
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div className="filter-panel__field">
                        <label className="filter-panel__label" htmlFor="filter-location">Area / Location</label>
                        <input
                          id="filter-location"
                          type="text"
                          className="filter-panel__input"
                          placeholder="e.g. Malir Cantt"
                          value={locationFilter}
                          onChange={e => setLocationFilter(e.target.value)}
                        />
                      </div>

                      {/* Category-specific filters (typed) */}
                      {catFilterFields.map(field => {
                        if (field.type === 'range') {
                          return (
                            <div className="filter-panel__field" key={field.key}>
                              <span className="filter-panel__label">{field.label}</span>
                              <div className="filter-price-row">
                                <div className="filter-panel__select-wrap">
                                  <select
                                    className="filter-panel__select"
                                    aria-label={`${field.label} from`}
                                    value={catFilters[`${field.key}From`] || ''}
                                    onChange={e => setCatFilters(prev => ({ ...prev, [`${field.key}From`]: e.target.value }))}
                                  >
                                    <option value="">From</option>
                                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                  <svg className="filter-panel__select-arrow" width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                    <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <span className="filter-price-sep">–</span>
                                <div className="filter-panel__select-wrap">
                                  <select
                                    className="filter-panel__select"
                                    aria-label={`${field.label} to`}
                                    value={catFilters[`${field.key}To`] || ''}
                                    onChange={e => setCatFilters(prev => ({ ...prev, [`${field.key}To`]: e.target.value }))}
                                  >
                                    <option value="">To</option>
                                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                  <svg className="filter-panel__select-arrow" width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                    <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        if (field.type === 'text') {
                          return (
                            <div className="filter-panel__field" key={field.key}>
                              <label className="filter-panel__label" htmlFor={`filter-${field.key}`}>{field.label}</label>
                              <input
                                id={`filter-${field.key}`}
                                type="text"
                                className="filter-panel__input"
                                placeholder={`Any ${field.label.toLowerCase()}`}
                                value={catFilters[field.key] || ''}
                                onChange={e => setCatFilters(prev => ({ ...prev, [field.key]: e.target.value }))}
                              />
                            </div>
                          );
                        }
                        return (
                          <div className="filter-panel__field" key={field.key}>
                            <label className="filter-panel__label" htmlFor={`filter-${field.key}`}>{field.label}</label>
                            <div className="filter-panel__select-wrap">
                              <select
                                id={`filter-${field.key}`}
                                className="filter-panel__select"
                                value={catFilters[field.key] || ''}
                                onChange={e => setCatFilters(prev => ({ ...prev, [field.key]: e.target.value }))}
                              >
                                <option value="">Any</option>
                                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                              <svg className="filter-panel__select-arrow" width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {activeFilterCount > 0 && (
                      <div className="filter-panel__footer">
                        <button className="filter-clear-all" onClick={clearAllFilters}>
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active filter chips */}
            <AnimatePresence>
              {activeChips.length > 0 && (
                <motion.div
                  className="filter-chips"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeChips.map(chip => (
                    <button
                      key={chip.key}
                      className="filter-chip"
                      onClick={chip.clear}
                      aria-label={`Remove filter: ${chip.label}`}
                    >
                      {chip.label}
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <line x1="2" y1="2" x2="10" y2="10"/>
                        <line x1="10" y1="2" x2="2" y2="10"/>
                      </svg>
                    </button>
                  ))}
                  {activeChips.length > 1 && (
                    <button className="filter-chip filter-chip--clear-all" onClick={clearAllFilters}>
                      Clear all
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

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
            ) : filtered.length === 0 ? (
              <div className="cat-empty">
                <div className="cat-empty__icon" aria-hidden="true">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </div>
                <h2 className="cat-empty__heading">No listings found.</h2>
                <p className="cat-empty__text">
                  {hasQuery
                    ? `No results for "${localQuery.trim()}". Try different keywords or browse all categories.`
                    : 'No listings match your filters. Try adjusting or clearing them.'}
                </p>
                <div className="cat-empty__actions">
                  {(hasQuery || activeFilterCount > 0) && (
                    <button className="cat-empty__cta" onClick={() => { clearSearch(); clearAllFilters(); }}>
                      Clear All
                    </button>
                  )}
                  <Link to="/" className={`cat-empty__cta${hasQuery || activeFilterCount > 0 ? ' cat-empty__cta--secondary' : ''}`}>
                    Browse Categories
                  </Link>
                </div>
              </div>
            ) : (
              <motion.div
                className="cat-grid"
                variants={staggerContainer(0.04)}
                initial="hidden"
                animate="visible"
              >
                {filtered.map(listing => (
                  <motion.div key={listing.id} variants={staggerItem}>
                    <ListingCard listing={listing} showSeller />
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
