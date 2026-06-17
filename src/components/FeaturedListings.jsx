import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ListingCard from './ListingCard';
import ScrollReveal from './ScrollReveal';
import LoadingState from './LoadingState';
import { useListings } from '../context/ListingsContext';
import { staggerContainer, staggerItem } from '../animations';
import './FeaturedListings.css';

const MAX_HOME_LISTINGS = 8;

export default function FeaturedListings() {
  const { allListings, loading } = useListings();

  // Approved listings, featured ads first then standard, newest within each group.
  const ordered = [...allListings]
    .sort((a, b) => (b.featured === a.featured ? b.id - a.id : b.featured - a.featured))
    .slice(0, MAX_HOME_LISTINGS);

  return (
    <section className="featured">
      <div className="featured__inner">
        <ScrollReveal className="featured__header">
          <h2 className="featured__heading">Featured Listings</h2>
          <Link to="/listings" className="featured__view-all">View all</Link>
        </ScrollReveal>

        {loading ? (
          <LoadingState label="Loading listings…" />
        ) : ordered.length === 0 ? (
          <div className="featured__empty">
            <p className="featured__empty-text">No listings yet — be the first to post.</p>
            <Link to="/add-listing" className="featured__empty-cta">+ Post a Listing</Link>
          </div>
        ) : (
          <motion.div
            className="featured__grid"
            variants={staggerContainer(0.06)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {ordered.map(listing => (
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
