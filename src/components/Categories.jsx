import { motion } from 'framer-motion';
import ScrollReveal from './ScrollReveal';
import { staggerContainer, staggerItem } from '../animations';
import './Categories.css';

const CATEGORIES = [
  {
    slug: 'cars',
    label: 'Cars & Vehicles',
    count: '128+',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&h=400&fit=crop',
  },
  {
    slug: 'electronics',
    label: 'Phones & Electronics',
    count: '156+',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop',
  },
  {
    slug: 'property',
    label: 'Property & Homes',
    count: '84+',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
  },
  {
    slug: 'furniture',
    label: 'Furniture & Home',
    count: '62+',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop',
  },
  {
    slug: 'jobs',
    label: 'Jobs & Careers',
    count: '47+',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop',
  },
  {
    slug: 'services',
    label: 'Local Services',
    count: '33+',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop',
  },
];

export default function Categories() {
  return (
    <section className="categories">
      <div className="categories__inner">
        <ScrollReveal>
          <div className="categories__header">
            <h2 className="categories__heading">Browse by Category</h2>
            <p className="categories__subheading">Find what you need from your neighbours in Malir Cantt</p>
          </div>
        </ScrollReveal>

        <motion.div
          className="categories__grid"
          variants={staggerContainer(0.07)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {CATEGORIES.map(cat => (
            <motion.a
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="category-card"
              variants={staggerItem}
              whileTap={{ scale: 0.98 }}
            >
              <img
                src={cat.image}
                alt={cat.label}
                className="category-card__image"
                loading="lazy"
              />
              <div className="category-card__overlay" aria-hidden="true" />
              <div className="category-card__body">
                <span className="category-card__count">{cat.count} listings</span>
                <h3 className="category-card__label">{cat.label}</h3>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
