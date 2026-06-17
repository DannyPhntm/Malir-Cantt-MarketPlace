// Maps a backend listing (Phase 5.1 schema) into the rich shape the existing UI
// components expect (ListingCard, ListingDetailPage, CategoryPage, …). This keeps
// every component unchanged while the data source moves from mock → backend.

import { CATEGORY_CONFIG } from '../data/categoryConfig';

const CATEGORY_DISPLAY = {
  vehicles: 'Vehicles',
  technology: 'Technology',
  property: 'Property',
  furniture: 'Furniture',
  jobs: 'Jobs',
  services: 'Services',
  gym: 'Gym & Fitness',
  shoes: 'Shoes & Footwear',
  food: 'Food & Home Kitchen',
};

// Parse the stored details JSON (string) into a flat object.
function parseDetails(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

// Build labelled chips ({ label, value }) from the details map, using the
// category's field definitions for nice labels + ordering. Falls back to the
// raw key for anything not in the config.
function buildMeta(categorySlug, details) {
  const fields = CATEGORY_CONFIG[categorySlug]?.fields || [];
  const labelFor = {};
  for (const f of fields) labelFor[f.name] = f.label;
  const ordered = [];
  // Config-ordered fields first…
  for (const f of fields) {
    const v = details[f.name];
    if (v != null && String(v).trim() !== '') ordered.push({ label: f.label, value: String(v) });
  }
  // …then any extra keys not in the config.
  for (const [k, v] of Object.entries(details)) {
    if (labelFor[k]) continue;
    if (v != null && String(v).trim() !== '') ordered.push({ label: k, value: String(v) });
  }
  return ordered;
}

function formatPrice(rupees) {
  const n = Number(rupees) || 0;
  // Pakistani digit grouping, e.g. 3800000 → "38,00,000".
  return `Rs ${n.toLocaleString('en-PK')}`;
}

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} minute${min !== 1 ? 's' : ''} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr !== 1 ? 's' : ''} ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day !== 1 ? 's' : ''} ago`;
  const mo = Math.floor(day / 30);
  return `${mo} month${mo !== 1 ? 's' : ''} ago`;
}

function adaptSeller(user) {
  const isBusiness = user?.accountType === 'business';
  return {
    name: user?.name || 'Seller',
    phone: user?.phone || '',
    memberSince: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '',
    isVerified: isBusiness ? !!user?.businessVerified : false,
    badgeType: isBusiness ? 'business' : 'resident',
    area: user?.residentLocation || 'Malir Cantt',
  };
}

export function adaptListing(listing) {
  if (!listing) return null;
  const images = (listing.images || [])
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((img) => img.imageUrl);

  const location = listing.user?.residentLocation || 'Malir Cantt';
  const details = parseDetails(listing.details);

  return {
    id: listing.id,
    // Owner id — lets the UI gate edit/manage controls to the owner.
    userId: listing.userId ?? listing.user?.id ?? null,
    title: listing.title,
    description: listing.description,
    categorySlug: listing.category,
    category: CATEGORY_DISPLAY[listing.category] || listing.category,
    details,
    meta: buildMeta(listing.category, details),
    price: formatPrice(listing.price),
    priceRaw: Number(listing.price) || 0,
    image: images[0] || '',
    images,
    featured: !!listing.featuredActive,
    featuredRequested: !!listing.featuredRequested,
    status: listing.status,
    location,
    timeAgo: relativeTime(listing.createdAt),
    createdAt: listing.createdAt,
    views: 0, // not tracked by the backend yet
    seller: adaptSeller(listing.user),
  };
}

export function adaptListings(list = []) {
  return list.map(adaptListing);
}
