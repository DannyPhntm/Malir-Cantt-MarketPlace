// Shop directory categories (slug → label). Single source for the frontend;
// mirrors SHOP_CATEGORIES in the server constants.
export const SHOP_CATEGORIES = [
  { slug: 'grocery',            label: 'Grocery & General Stores' },
  { slug: 'food-restaurants',   label: 'Food & Restaurants' },
  { slug: 'electronics-mobile', label: 'Electronics & Mobile' },
  { slug: 'clothing-fashion',   label: 'Clothing & Fashion' },
  { slug: 'pharmacy-health',    label: 'Pharmacy & Health' },
  { slug: 'car-services',       label: 'Car Services' },
  { slug: 'home-furniture',     label: 'Home & Furniture' },
  { slug: 'beauty-salon',       label: 'Beauty & Salon' },
  { slug: 'stationery-books',   label: 'Stationery & Books' },
  { slug: 'gyms-fitness',       label: 'Gyms & Fitness' },
  { slug: 'services-repairs',   label: 'Services & Repairs' },
  { slug: 'other',              label: 'Other' },
];

export const SHOP_CATEGORY_LABEL = Object.fromEntries(
  SHOP_CATEGORIES.map((c) => [c.slug, c.label]),
);
