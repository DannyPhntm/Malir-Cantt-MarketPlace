// SEO config — per-route titles/descriptions + which routes are indexable.
// Consumed by <RouteSeo/> (src/components/RouteSeo.jsx).

export const SITE_URL = 'https://malircanttbazaar.com';
export const SITE_NAME = 'People of Malir Cantt Bazaar';
export const DEFAULT_TITLE = 'People of Malir Cantt Bazaar | Buy, Sell & Discover Local Businesses';
export const DEFAULT_DESCRIPTION =
  'A local marketplace for Malir Cantt residents to buy, sell, post listings, discover shops, and connect with verified local businesses.';
// Social preview image (place a real 1200×630 image at public/og-image.png).
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

// Exact-path SEO for public pages. Titles kept honest + local.
export const ROUTE_SEO = {
  '/': { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  '/listings': { title: 'Browse Listings | People of Malir Cantt Bazaar', description: 'Browse items, services, and jobs posted by Malir Cantt residents and local businesses.' },
  '/browse': { title: 'Browse Listings | People of Malir Cantt Bazaar', description: 'Browse items, services, and jobs posted by Malir Cantt residents and local businesses.' },
  '/shops': { title: 'Local Shops Directory | People of Malir Cantt Bazaar', description: 'Discover verified local shops and businesses serving Malir Cantt, Karachi.' },
  '/about': { title: 'About | People of Malir Cantt Bazaar', description: 'A community marketplace built for Malir Cantt residents — buy, sell, hire, and discover locally.' },
  '/contact': { title: 'Contact | People of Malir Cantt Bazaar', description: 'Get in touch with the People of Malir Cantt Bazaar team.' },
  '/terms': { title: 'Terms of Service | People of Malir Cantt Bazaar', description: 'The simple rules for using People of Malir Cantt Bazaar.' },
  '/privacy': { title: 'Privacy Policy | People of Malir Cantt Bazaar', description: 'What information we collect and how we use it.' },
  '/safety': { title: 'Community Guidelines & Safety | People of Malir Cantt Bazaar', description: 'How we keep the Malir Cantt marketplace trustworthy and safe.' },
};

// Public dynamic-route prefixes → generic indexable title (detail pages can
// refine their own <title> later). Category/listing/shop/seller pages.
export const PUBLIC_PREFIXES = [
  { prefix: '/category/', title: 'Category | People of Malir Cantt Bazaar', description: DEFAULT_DESCRIPTION },
  { prefix: '/listing/', title: 'Listing | People of Malir Cantt Bazaar', description: DEFAULT_DESCRIPTION },
  { prefix: '/shops/', title: 'Shop | People of Malir Cantt Bazaar', description: 'A verified local shop on People of Malir Cantt Bazaar.' },
  { prefix: '/seller/', title: 'Seller | People of Malir Cantt Bazaar', description: DEFAULT_DESCRIPTION },
];

// Private / auth routes → noindex,nofollow (never indexed).
export const NOINDEX_PREFIXES = [
  '/admin', '/dashboard', '/profile', '/login', '/register', '/reset-password',
  '/verify-email', '/apply-business', '/my-shop', '/my-listings', '/saved-listings',
  '/add-listing', '/edit-listing',
];

export function isNoindexPath(path) {
  return NOINDEX_PREFIXES.some((p) => path === p || path.startsWith(p + '/') || path === p);
}

export function seoForPath(path) {
  if (ROUTE_SEO[path]) return ROUTE_SEO[path];
  const pref = PUBLIC_PREFIXES.find((p) => path.startsWith(p.prefix));
  if (pref) return { title: pref.title, description: pref.description };
  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
}
