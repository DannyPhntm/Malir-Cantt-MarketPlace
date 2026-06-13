import { motion } from 'framer-motion';
import { fadeUp, viewport } from '../animations';

// Standalone scroll-triggered fade-up wrapper.
// Not for use inside a staggerContainer — use staggerItem variants there instead.
export default function ScrollReveal({ children, delay = 0, className }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      {children}
    </motion.div>
  );
}
