import { motion } from 'framer-motion';
import ListingCard from './ListingCard';
import ScrollReveal from './ScrollReveal';
import { FEATURED_LISTINGS } from '../data/listings';
import { staggerContainer, staggerItem } from '../animations';
import './FeaturedListings.css';

const FEATURED = FEATURED_LISTINGS.filter(l => l.featured);

export default function FeaturedListings() {
  return (
    <section className="featured">
      <div className="featured__inner">
        <ScrollReveal className="featured__header">
          <h2 className="featured__heading">Featured Listings</h2>
          <a href="/listings" className="featured__view-all">View all</a>
        </ScrollReveal>

        <motion.div
          className="featured__grid"
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {FEATURED.map(listing => (
            <motion.div key={listing.id} variants={staggerItem}>
              <ListingCard listing={listing} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
