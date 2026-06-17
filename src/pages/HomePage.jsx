import { useNavigate } from 'react-router-dom';
import { PulseFitHero } from '../components/ui/pulse-fit-hero';
import FeaturedListings from '../components/FeaturedListings';
import RecentlyViewed from '../components/RecentlyViewed';
import PageTransition from '../components/PageTransition';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <main>
        <PulseFitHero
          showHeader={false}
          backgroundImage="/malir-cantt-gate.png"
          title="Find Everything"
          titleAccent="Inside Malir Cantt."
          subtitle="Buy, sell, and connect with your neighbours. The trusted marketplace exclusively for Malir Cantt residents."
          showSearch={true}
          searchPlaceholder="Search for cars, electronics, property..."
          onSearch={(q) => { if (q.trim()) navigate(`/listings?q=${encodeURIComponent(q.trim())}`); }}
          popularTags={['Vehicles', 'Technology', 'Property', 'Jobs', 'Furniture', 'Services']}
          trustStats={[
            {
              value: '482+',
              label: 'Active Listings',
              icon: (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="1" y="1" width="10" height="10" rx="2" />
                  <line x1="3.5" y1="4" x2="8.5" y2="4" />
                  <line x1="3.5" y1="6.5" x2="7" y2="6.5" />
                  <line x1="3.5" y1="9" x2="8" y2="9" />
                </svg>
              ),
            },
            {
              value: '8',
              label: 'Categories',
              icon: (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="1" y="1" width="4" height="4" rx="1" />
                  <rect x="7" y="1" width="4" height="4" rx="1" />
                  <rect x="1" y="7" width="4" height="4" rx="1" />
                  <rect x="7" y="7" width="4" height="4" rx="1" />
                </svg>
              ),
            },
            {
              value: 'Updated',
              label: 'Daily',
              icon: (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="6" cy="6" r="4.5" />
                  <path d="M6 3.5v2.5l1.5 1.5" />
                </svg>
              ),
            },
            {
              value: 'Verified',
              label: 'Residents',
              icon: (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="4.5" cy="3.5" r="1.5" />
                  <path d="M1.5 10c0-1.66 1.34-3 3-3s3 1.34 3 3" />
                  <circle cx="8.5" cy="3.5" r="1.5" />
                  <path d="M10.5 10c0-1.66-1.34-3-3-3" />
                </svg>
              ),
            },
          ]}
          programs={[
            {
              image: '/categories/vehicles.png',
              category: 'Vehicles',
              title: 'Browse Vehicles',
              count: '1,250 active listings',
              href: '/category/vehicles',
            },
            {
              image: '/categories/technology.png',
              category: 'Technology',
              title: 'Phones & Gadgets',
              count: '850 active listings',
              href: '/category/technology',
            },
            {
              image: '/categories/property.png',
              category: 'Property',
              title: 'Homes & Apartments',
              count: '320 active listings',
              href: '/category/property',
            },
            {
              image: '/categories/furniture.png',
              category: 'Furniture',
              title: 'Home & Living',
              count: '450 active listings',
              href: '/category/furniture',
            },
            {
              image: '/categories/jobs.png',
              category: 'Jobs',
              title: 'Local Opportunities',
              count: '210 active listings',
              href: '/category/jobs',
            },
            {
              image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
              category: 'Services',
              title: 'Local Services',
              count: '680 active listings',
              href: '/category/services',
            },
            {
              image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
              category: 'Gym & Fitness',
              title: 'Gym Equipment',
              count: '95 active listings',
              href: '/category/gym',
            },
            {
              image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
              category: 'Shoes & Footwear',
              title: 'Shoes & Sneakers',
              count: '178 active listings',
              href: '/category/shoes',
            },
          ]}
        />
        <FeaturedListings />
        <RecentlyViewed />
      </main>
    </PageTransition>
  );
}
