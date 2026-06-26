import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import LoadingState from '../components/LoadingState';
import VerifiedBadge from '../components/VerifiedBadge';
import shopsApi from '../services/shopsApi';
import { SHOP_CATEGORY_LABEL } from '../data/shopConfig';
import './ShopDetailPage.css';

// 03XX-XXXXXXX → 92XXXXXXXXXX for wa.me.
function toWhatsApp(num = '') {
  const d = num.replace(/\D/g, '');
  if (d.startsWith('0')) return `92${d.slice(1)}`;
  return d;
}

export default function ShopDetailPage() {
  const { id } = useParams();
  const [shop, setShop] = useState(undefined); // undefined=loading, null=not found
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    shopsApi.get(id)
      .then((res) => { if (active) { setShop(res.shop || null); setError(''); } })
      .catch((e) => { if (active) { setShop(null); setError(e?.status === 404 ? '' : (e?.message || '')); } });
    return () => { active = false; };
  }, [id]);

  if (shop === undefined) {
    return <PageTransition><main className="shopd"><LoadingState label="Loading shop…" /></main></PageTransition>;
  }
  if (!shop) {
    return (
      <PageTransition>
        <main className="shopd">
          <div className="shopd__notfound">
            <h1>Shop not found</h1>
            <p>{error || 'This shop may have been removed or is not yet approved.'}</p>
            <Link to="/shops" className="shopd__btn">Browse all shops</Link>
          </div>
        </main>
      </PageTransition>
    );
  }

  const initials = (shop.name || 'S').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const wa = toWhatsApp(shop.whatsapp || shop.phone);

  return (
    <PageTransition>
      <main className="shopd">
        <div className="shopd__inner">
          <nav className="shopd__breadcrumb" aria-label="Breadcrumb">
            <Link to="/shops">Shops</Link><span aria-hidden="true">›</span><span>{shop.name}</span>
          </nav>

          <header className="shopd__header">
            <span className="shopd__logo" aria-hidden="true">
              {shop.logoUrl ? <img src={shop.logoUrl} alt="" /> : initials}
            </span>
            <div className="shopd__head-info">
              <div className="shopd__title-row">
                <h1 className="shopd__name">{shop.name}</h1>
                {shop.owner?.businessVerified && <VerifiedBadge type="business" size="md" />}
              </div>
              <p className="shopd__cat">{SHOP_CATEGORY_LABEL[shop.shopCategory] || shop.shopCategory}</p>
              {shop.sells && <p className="shopd__sells">{shop.sells}</p>}
            </div>
          </header>

          <div className="shopd__grid">
            <div className="shopd__main">
              {shop.description && (
                <section className="shopd__card">
                  <h2 className="shopd__card-title">About</h2>
                  <p className="shopd__desc">{shop.description}</p>
                </section>
              )}
              {Array.isArray(shop.images) && shop.images.length > 0 && (
                <section className="shopd__card">
                  <h2 className="shopd__card-title">Photos</h2>
                  <div className="shopd__photos">
                    {shop.images.map((src, i) => <img key={i} src={src} alt={`${shop.name} ${i + 1}`} className="shopd__photo" />)}
                  </div>
                </section>
              )}
            </div>

            <aside className="shopd__side">
              <div className="shopd__card">
                <div className="shopd__rows">
                  <div className="shopd__row"><span className="shopd__row-k">Location</span><span className="shopd__row-v">{shop.location}</span></div>
                  {shop.openingHours && <div className="shopd__row"><span className="shopd__row-k">Hours</span><span className="shopd__row-v">{shop.openingHours}</span></div>}
                  <div className="shopd__row"><span className="shopd__row-k">Delivery</span><span className="shopd__row-v">{shop.deliveryAvailable ? 'Available' : 'Not available'}</span></div>
                  <div className="shopd__row"><span className="shopd__row-k">Phone</span><span className="shopd__row-v">{shop.phone}</span></div>
                </div>
                <div className="shopd__actions">
                  <a className="shopd__btn shopd__btn--whatsapp" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a>
                  <a className="shopd__btn shopd__btn--call" href={`tel:${shop.phone}`}>Call</a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
