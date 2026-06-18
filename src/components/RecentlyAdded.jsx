import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ListingCard from './ListingCard';
import ScrollReveal from './ScrollReveal';
import LoadingState from './LoadingState';
import { useListings } from '../context/ListingsContext';
import { staggerContainer, staggerItem } from '../animations';
import './FeaturedListings.css';

const MAX_RECENT = 8;

// Latest approved listings (newest first). Reuses the Featured Listings layout
// so the section matches the rest of the homepage exactly.
export default function RecentlyAdded() {
  const { allListings, loading } = useListings();

  const latest = [...allListings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, MAX_RECENT);

  // Nothing approved yet — hide the section rather than show an empty block
  // (Featured already owns the empty-state CTA above it).
  if (!loading && latest.length === 0) return null;

  return (
    <section className="featured">
      <div className="featured__inner">
        <ScrollReveal className="featured__header">
          <h2 className="featured__heading">Recently Added</h2>
          <Link to="/listings" className="featured__view-all">View all</Link>
        </ScrollReveal>

        {loading ? (
          <LoadingState label="Loading listings…" />
        ) : (
          <motion.div
            className="featured__grid"
            variants={staggerContainer(0.06)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {latest.map((listing) => (
              <motion.div key={listing.id} variants={staggerItem}>
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
