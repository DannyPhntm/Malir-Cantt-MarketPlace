import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SITE_URL, SITE_NAME, OG_IMAGE, seoForPath, isNoindexPath,
} from '../lib/seoConfig';

// Sets document head tags per route (title, description, canonical, robots, OG,
// Twitter) imperatively — no extra dependency. Rendered once inside the Router.
// Googlebot executes JS, so client-set tags are indexable. Canonical always
// points at the production domain so Vercel preview URLs don't compete; on any
// non-production host we force noindex so previews/localhost aren't indexed.
function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, description } = seoForPath(pathname);
    const canonical = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
    const isProdHost =
      typeof window !== 'undefined' && window.location.hostname === 'malircanttbazaar.com';
    const robots = !isProdHost || isNoindexPath(pathname) ? 'noindex,nofollow' : 'index,follow';

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertCanonical(canonical);

    // Open Graph
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:image', OG_IMAGE);

    // Twitter
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', OG_IMAGE);
  }, [pathname]);

  return null;
}
