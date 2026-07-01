import { useNavigate } from 'react-router-dom';
import { PulseFitHero } from '../components/ui/pulse-fit-hero';
import FeaturedListings from '../components/FeaturedListings';
import RecentlyAdded from '../components/RecentlyAdded';
import RecentlyViewed from '../components/RecentlyViewed';
import PageTransition from '../components/PageTransition';
import { usePublicStats } from '../hooks/usePublicStats';

// Category carousel cards. Counts are filled from live backend data; the rest
// (image/title/href) is static presentation.
const CATEGORY_CARDS = [
  { slug: 'vehicles',    category: 'Vehicles',     title: 'Browse Vehicles',     image: '/categories/vehicles.png',    href: '/category/vehicles' },
  { slug: 'property',    category: 'Property',      title: 'Homes & Apartments',  image: '/categories/property.png',    href: '/category/property' },
  { slug: 'electronics', category: 'Electronics',   title: 'Phones & Gadgets',    image: '/categories/electronics.png', href: '/category/electronics' },
  { slug: 'home-living', category: 'Home & Living', title: 'Furniture & Decor',   image: '/categories/home-living.png', href: '/category/home-living' },
  { slug: 'fashion',     category: 'Fashion',       title: 'Clothing & Shoes',    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',  href: '/category/fashion' },
  { slug: 'services',    category: 'Services',      title: 'Local Services',      image: '/categories/services.png',    href: '/category/services' },
  { slug: 'food',        category: 'Food',          title: 'Homemade & Local',    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop',  href: '/category/food' },
  { slug: 'jobs',        category: 'Jobs',          title: 'Local Opportunities', image: '/categories/jobs.png',        href: '/category/jobs' },
  { slug: 'fitness',     category: 'Fitness',       title: 'Gym & Fitness',       image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',  href: '/category/fitness' },
  { slug: 'education',   category: 'Education',     title: 'Tuition & Classes',   image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',  href: '/category/education' },
  { slug: 'other',       category: 'Other',         title: 'Everything Else',     image: '/categories/other.png',       href: '/category/other' },
];

const ListIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="1" y="1" width="10" height="10" rx="2" />
    <line x1="3.5" y1="4" x2="8.5" y2="4" /><line x1="3.5" y1="6.5" x2="7" y2="6.5" /><line x1="3.5" y1="9" x2="8" y2="9" />
  </svg>
);
const UsersIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="4.5" cy="3.5" r="1.5" /><path d="M1.5 10c0-1.66 1.34-3 3-3s3 1.34 3 3" />
    <circle cx="8.5" cy="3.5" r="1.5" /><path d="M10.5 10c0-1.66-1.34-3-3-3" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 1L2 2.5v3C2 8 6 11 6 11s4-3 4-5.5v-3L6 1z" /><path d="M4.5 5.8L5.6 7 8 4.3" />
  </svg>
);
const GridIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="1" y="1" width="4" height="4" rx="1" /><rect x="7" y="1" width="4" height="4" rx="1" />
    <rect x="1" y="7" width="4" height="4" rx="1" /><rect x="7" y="7" width="4" height="4" rx="1" />
  </svg>
);

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-PK') : '—');

export default function HomePage() {
  const navigate = useNavigate();
  const stats = usePublicStats();

  // Real trust signals from live backend data (no fabricated numbers).
  const trustStats = [
    { value: fmt(stats?.activeListings), label: 'Active Listings', icon: <ListIcon /> },
    { value: fmt(stats?.users), label: 'Registered Users', icon: <UsersIcon /> },
    { value: fmt(stats?.verifiedBusinesses), label: 'Verified Businesses', icon: <ShieldIcon /> },
    { value: stats ? String(stats.categories) : '—', label: 'Categories', icon: <GridIcon /> },
  ];

  // Category cards with real listing counts.
  const programs = CATEGORY_CARDS.map((c) => {
    const n = stats?.categoryCounts?.[c.slug];
    return { ...c, count: n != null ? `${n.toLocaleString('en-PK')} ${n === 1 ? 'listing' : 'listings'}` : '—' };
  });

  return (
    <PageTransition>
      <main>
        <PulseFitHero
          showHeader={false}
          backgroundImage="/malir-cantt-gate.png"
          title="Find Everything"
          titleAccent="Inside Malir Cantt."
          subtitle="Buy and sell within Malir Cantt. Find local shops, services, jobs, and everyday listings from people in your community."
          showSearch={true}
          searchPlaceholder="Search for cars, electronics, property..."
          onSearch={(q) => { if (q.trim()) navigate(`/listings?q=${encodeURIComponent(q.trim())}`); }}
          popularTags={['Vehicles', 'Technology', 'Property', 'Jobs', 'Furniture', 'Services']}
          trustStats={trustStats}
          programs={programs}
        />
        <FeaturedListings />
        <RecentlyAdded />
        <RecentlyViewed />
      </main>
    </PageTransition>
  );
}
