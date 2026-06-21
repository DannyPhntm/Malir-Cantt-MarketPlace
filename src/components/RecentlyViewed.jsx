import { useState } from 'react';
import { motion } from 'framer-motion';
import ListingCard from './ListingCard';
import ScrollReveal from './ScrollReveal';
import { staggerContainer, staggerItem } from '../animations';
import { getRecentlyViewed, clearRecentlyViewed } from '../services/recentlyViewedService';
import './RecentlyViewed.css';

export default function RecentlyViewed() {
  const [items, setItems] = useState(getRecentlyViewed);

  if (items.length === 0) return null;

  const handleClear = () => {
    clearRecentlyViewed();
    setItems([]);
  };

  return (
    <section className="recently">
      <div className="recently__inner">
        <ScrollReveal className="recently__header">
          <h2 className="recently__heading">Recently Viewed</h2>
          <button className="recently__clear" onClick={handleClear}>
            Clear
          </button>
        </ScrollReveal>

        <motion.div
          className="recently__grid"
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {items.slice(0, 8).map(listing => (
            <motion.div key={listing.id} variants={staggerItem}>
              <ListingCard listing={listing} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
