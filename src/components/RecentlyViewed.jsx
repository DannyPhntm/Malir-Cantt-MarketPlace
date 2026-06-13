import { useState } from 'react';
import { motion } from 'framer-motion';
import ListingCard from './ListingCard';
import ScrollReveal from './ScrollReveal';
import { staggerContainer, staggerItem } from '../animations';
import './RecentlyViewed.css';

const RECENTLY_VIEWED_KEY = 'malir-recently-viewed';

export default function RecentlyViewed() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    } catch {
      return [];
    }
  });

  if (items.length === 0) return null;

  const handleClear = () => {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
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
