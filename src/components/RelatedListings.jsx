import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ListingCard from './ListingCard';
import { staggerContainer, staggerItem } from '../animations';
import './RelatedListings.css';

const MAX_RELATED = 4;

/**
 * "You May Also Like" — shows listings from the SAME category as the current
 * listing. Reusable across any page that has a listing in context.
 *
 * Props:
 *   listing   — the current listing (used for category + self-exclusion)
 *   listings  — the pool to draw from (e.g. allListings from ListingsContext)
 *   title     — section heading (defaults to "You May Also Like")
 */
export default function RelatedListings({ listing, listings, title = 'You May Also Like' }) {
  if (!listing) return null;

  const related = (listings || [])
    .filter(l => l.categorySlug === listing.categorySlug && l.id !== listing.id)
    .slice(0, MAX_RELATED);

  if (related.length === 0) return null;

  return (
    <section className="related">
      <div className="related__inner">
        <div className="related__header">
          <h2 className="related__heading">{title}</h2>
          <Link to={`/category/${listing.categorySlug}`} className="related__view-all">
            View all
          </Link>
        </div>
        <motion.div
          className="related__grid"
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {related.map(l => (
            <motion.div key={l.id} variants={staggerItem}>
              <ListingCard listing={l} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
