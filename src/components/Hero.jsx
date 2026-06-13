import { motion } from 'framer-motion';
import { fadeUp, tap } from '../animations';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__inner">
        <motion.h1
          className="hero__title"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          Find Everything<br />
          <span className="hero__title-accent">Inside Malir Cantt.</span>
        </motion.h1>

        <motion.p
          className="hero__subtitle"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.08}
        >
          Buy, sell, and connect with your community.
        </motion.p>

        <motion.div
          className="hero__search"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.16}
        >
          <div className="hero__search-wrap" role="search">
            <svg className="hero__search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="9" r="6" />
              <path d="M15 15l3 3" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Search for cars, electronics, property..."
              className="hero__search-input"
              aria-label="Search listings"
            />
            <motion.button className="hero__search-btn" whileTap={tap}>
              Search
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="hero__tags"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.22}
        >
          <span className="hero__tag-label">Popular:</span>
          {['Cars', 'Phones', 'Apartments', 'Jobs'].map(tag => (
            <a key={tag} href={`/category/${tag.toLowerCase()}`} className="hero__tag">{tag}</a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
