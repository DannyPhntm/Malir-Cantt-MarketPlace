// Central animation system — all Framer Motion variants and values.
// Components import from here; never define local variants.

// ── Easing ──────────────────────────────────────────────────────────────────
// ease.out: Apple/Linear ease-out-expo — fast start, graceful settle.
export const ease = {
  out:   [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
};

// ── Durations in seconds ─────────────────────────────────────────────────────
export const dur = {
  fast: 0.15,
  base: 0.22,
  slow: 0.34,
};

// ── Viewport config for whileInView ─────────────────────────────────────────
export const viewport = { once: true, amount: 0.15 };

// ── Fade up — hero elements, section headings ────────────────────────────────
// Supports staggered delay via `custom={n}` on individual elements.
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: dur.slow, ease: ease.out, delay },
  }),
};

// ── Stagger container — wraps a list of staggerItem children ─────────────────
// Usage: variants={staggerContainer(0.05)}  (pass custom stagger if needed)
export const staggerContainer = (stagger = 0.05) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
});

// ── Stagger item — child of a staggerContainer ───────────────────────────────
export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.slow, ease: ease.out },
  },
};

// ── Nav mobile menu open / close ─────────────────────────────────────────────
export const navMenu = {
  initial:    { opacity: 0, y: -8 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -8 },
  transition: { duration: dur.base, ease: ease.out },
};

// ── Button / interactive element press feedback ───────────────────────────────
// Usage: <motion.button whileTap={tap}>
// scale-only: does not conflict with CSS background/shadow hover states.
export const tap = { scale: 0.97 };
