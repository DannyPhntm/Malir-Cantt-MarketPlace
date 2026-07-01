import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import LoadingState from '../components/LoadingState';
import VerifiedBadge from '../components/VerifiedBadge';
import shopsApi from '../services/shopsApi';
import { SHOP_CATEGORIES, SHOP_CATEGORY_LABEL } from '../data/shopConfig';
import { staggerContainer, staggerItem } from '../animations';
import './CategoryPage.css';
import './ShopsPage.css';

function ShopCard({ shop }) {
  const initials = (shop.name || 'S').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <motion.div variants={staggerItem}>
      <Link to={`/shops/${shop.id}`} className="shop-card">
        <div className="shop-card__top">
          <span className="shop-card__logo" aria-hidden="true">
            {shop.logoUrl ? <img src={shop.logoUrl} alt="" /> : initials}
          </span>
          <div className="shop-card__id">
            <span className="shop-card__name">{shop.name}</span>
            <span className="shop-card__cat">{SHOP_CATEGORY_LABEL[shop.shopCategory] || shop.shopCategory}</span>
          </div>
          {shop.owner?.businessVerified && <VerifiedBadge type="business" size="sm" />}
        </div>
        {shop.sells && <p className="shop-card__sells">{shop.sells}</p>}
        <div className="shop-card__footer">
          <span className="shop-card__loc">{shop.location}</span>
          {shop.deliveryAvailable && <span className="shop-card__pill">Delivery</span>}
        </div>
      </Link>
    </motion.div>
  );
}

export default function ShopsPage() {
  const [shops, setShops] = useState(null);
  const [error, setError] = useState('');
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');

  const mounted = useRef(true);
  const load = useCallback(() => {
    shopsApi.list()
      .then((res) => { if (mounted.current) { setShops(res.shops || []); setError(''); } })
      .catch((e) => { if (mounted.current) setError(e?.message || 'Could not load shops.'); });
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    // Refetch when the user returns to the tab/page so a newly approved shop
    // shows without a manual refresh (API also sends no-store).
    const onFocus = () => { if (document.visibilityState !== 'hidden') load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      mounted.current = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [load]);

  const filtered = useMemo(() => {
    if (!shops) return [];
    const tok = q.trim().toLowerCase();
    return shops.filter((s) =>
      (!cat || s.shopCategory === cat) &&
      (!tok || `${s.name} ${s.sells || ''} ${s.description || ''} ${s.location}`.toLowerCase().includes(tok)));
  }, [shops, cat, q]);

  return (
    <PageTransition>
      <main className="cat-page">
        <header className="cat-hero">
          <div className="cat-hero__inner">
            <h1 className="cat-hero__title">Shops in Malir Cantt</h1>
            <p className="cat-hero__desc">Discover local shops and businesses — what they sell, where they are, and how to reach them.</p>
          </div>
        </header>

        <div className="cat-content">
          <div className="cat-content__inner">
            <div className="shops-toolbar">
              <p className="shops-toolbar__count">
                {shops ? <>Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'shop' : 'shops'}</> : 'Loading…'}
              </p>
              <div className="shops-toolbar__controls">
                <input
                  className="shops-search" type="search" placeholder="Search shops…"
                  value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search shops"
                />
                <select className="shops-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
                  <option value="">All Categories</option>
                  {SHOP_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {!shops ? (
              <LoadingState label="Loading shops…" />
            ) : error ? (
              <div className="cat-empty">
                <h2 className="cat-empty__heading">Couldn't load shops</h2>
                <p className="cat-empty__text">{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="cat-empty">
                <h2 className="cat-empty__heading">No shops found</h2>
                <p className="cat-empty__text">No shops match this view yet. Approved business accounts can add their shop from the Dashboard.</p>
                <Link to="/my-shop" className="cat-empty__cta">+ Add your shop</Link>
              </div>
            ) : (
              <motion.div className="shops-grid" variants={staggerContainer} initial="hidden" animate="show">
                {filtered.map((s) => <ShopCard key={s.id} shop={s} />)}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
