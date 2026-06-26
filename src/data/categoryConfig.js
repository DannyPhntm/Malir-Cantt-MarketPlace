const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => String(currentYear - i));
const STD_CONDITION = ['New', 'Like New', 'Good', 'Fair'];

export const CATEGORY_CONFIG = {
  vehicles: {
    label: 'Vehicles',
    titlePlaceholder: 'e.g. Honda Civic 2022 — Automatic Petrol',
    priceLabel: 'Price',
    pricePlaceholder: 'e.g. 38,00,000',
    images: { required: true, min: 1, max: 10, label: null },
    subcategories: [
      { slug: 'cars', label: 'Cars' }, { slug: 'bikes', label: 'Bikes' },
      { slug: 'auto-parts', label: 'Auto Parts' }, { slug: 'accessories', label: 'Accessories' },
    ],
    fields: [
      { name: 'make',         label: 'Make',         type: 'text',   required: true,  placeholder: 'e.g. Honda',       col: 1 },
      { name: 'model',        label: 'Model',        type: 'text',   required: true,  placeholder: 'e.g. Civic',       col: 1 },
      { name: 'year',         label: 'Year',         type: 'select', required: true,  options: YEARS,                  col: 1 },
      { name: 'mileage',      label: 'Mileage',      type: 'text',                    placeholder: 'e.g. 45,000 km',   col: 1 },
      { name: 'fuelType',     label: 'Fuel Type',    type: 'select',                  options: ['Petrol','Diesel','Hybrid','Electric','CNG'], col: 1 },
      { name: 'transmission', label: 'Transmission', type: 'select',                  options: ['Manual','Automatic'], col: 1 },
      { name: 'colour',       label: 'Colour',       type: 'text',                    placeholder: 'e.g. Pearl White', col: 1 },
      { name: 'condition',    label: 'Condition',    type: 'select', required: true,  options: STD_CONDITION,          col: 1 },
    ],
  },

  property: {
    label: 'Property',
    titlePlaceholder: 'e.g. 3 Bedroom Apartment in Malir Cantt',
    priceLabel: 'Price / Rent',
    pricePlaceholder: 'e.g. 1,20,00,000',
    images: { required: true, min: 1, max: 10, label: null },
    subcategories: [
      { slug: 'houses', label: 'Houses' }, { slug: 'apartments', label: 'Apartments' },
      { slug: 'plots', label: 'Plots' }, { slug: 'rentals', label: 'Rentals' },
    ],
    fields: [
      { name: 'propertyType', label: 'Property Type',    type: 'select', required: true, options: ['Apartment','House','Plot','Shop','Office','Warehouse'], col: 1 },
      { name: 'listingType',  label: 'For Sale or Rent', type: 'select', required: true, options: ['For Sale','For Rent'], col: 1 },
      { name: 'bedrooms',     label: 'Bedrooms',         type: 'select',                 options: ['Studio','1','2','3','4','5+'], col: 1 },
      { name: 'bathrooms',    label: 'Bathrooms',        type: 'select',                 options: ['1','2','3','4','5+'], col: 1 },
      { name: 'area',         label: 'Area',             type: 'text',                   placeholder: 'e.g. 1,200 sq ft', col: 1 },
      { name: 'furnished',    label: 'Furnished',        type: 'select',                 options: ['Furnished','Semi-Furnished','Unfurnished'], col: 1 },
      { name: 'parking',      label: 'Parking',          type: 'select',                 options: ['Yes','No'], col: 1 },
    ],
  },

  electronics: {
    label: 'Electronics',
    titlePlaceholder: 'e.g. iPhone 15 Pro Max 256GB',
    priceLabel: 'Price',
    pricePlaceholder: 'e.g. 3,50,000',
    images: { required: true, min: 1, max: 10, label: null },
    subcategories: [
      { slug: 'phones', label: 'Phones' }, { slug: 'laptops', label: 'Laptops' },
      { slug: 'gaming', label: 'Gaming' }, { slug: 'appliances', label: 'Appliances' },
    ],
    fields: [
      { name: 'brand',     label: 'Brand',                   type: 'text',   required: true,  placeholder: 'e.g. Apple',        col: 1 },
      { name: 'model',     label: 'Model',                   type: 'text',   required: true,  placeholder: 'e.g. iPhone 15 Pro', col: 1 },
      { name: 'condition', label: 'Condition',               type: 'select', required: true,  options: [...STD_CONDITION, 'For Parts'], col: 1 },
      { name: 'warranty',  label: 'Warranty',                type: 'select',                  options: ['No Warranty','1 Month','3 Months','6 Months','1 Year','2 Years'], col: 1 },
      { name: 'storage',   label: 'Storage (if applicable)', type: 'text',                    placeholder: 'e.g. 256GB',        col: 2 },
    ],
  },

  'home-living': {
    label: 'Home & Living',
    titlePlaceholder: 'e.g. 6-Seater Dining Table Set',
    priceLabel: 'Price',
    pricePlaceholder: 'e.g. 85,000',
    images: { required: true, min: 1, max: 10, label: null },
    subcategories: [
      { slug: 'furniture', label: 'Furniture' }, { slug: 'home-decor', label: 'Home Decor' },
      { slug: 'kitchen', label: 'Kitchen' }, { slug: 'garden', label: 'Garden' },
      { slug: 'household', label: 'Household Items' },
    ],
    fields: [
      { name: 'itemType',   label: 'Item Type',             type: 'text',                   placeholder: 'e.g. Sofa, Lamp, Cookware, Planter', col: 1 },
      { name: 'material',   label: 'Material',              type: 'select',                 options: ['Wood','Metal','Glass','Plastic','Fabric','Leather','Ceramic','Other'], col: 1 },
      { name: 'condition',  label: 'Condition',             type: 'select', required: true, options: STD_CONDITION, col: 1 },
      { name: 'dimensions', label: 'Dimensions (optional)', type: 'text',                   placeholder: 'e.g. 180 × 90 cm', col: 1 },
    ],
  },

  fashion: {
    label: 'Fashion',
    titlePlaceholder: 'e.g. Nike Air Jordan 1 High OG',
    priceLabel: 'Price',
    pricePlaceholder: 'e.g. 18,000',
    images: { required: true, min: 1, max: 10, label: null },
    subcategories: [
      { slug: 'shoes', label: 'Shoes' }, { slug: 'clothing', label: 'Clothing' },
      { slug: 'accessories', label: 'Accessories' },
    ],
    fields: [
      { name: 'brand',     label: 'Brand',     type: 'text',   required: true, placeholder: 'e.g. Nike, Adidas, Gul Ahmed', col: 1 },
      { name: 'itemType',  label: 'Item Type', type: 'text',   required: true, placeholder: 'e.g. Sneakers, Kurta, Watch',  col: 1 },
      { name: 'size',      label: 'Size',      type: 'text',                   placeholder: 'e.g. UK 9 / M / EU 43',        col: 1 },
      { name: 'gender',    label: 'Gender',    type: 'select', required: true, options: ['Men','Women','Unisex','Kids'],    col: 1 },
      { name: 'condition', label: 'Condition', type: 'select', required: true, options: ['New','Like New','Used'],          col: 1 },
      { name: 'colour',    label: 'Colour',    type: 'text',                   placeholder: 'e.g. Black / White',          col: 1 },
    ],
  },

  services: {
    label: 'Services',
    titlePlaceholder: 'e.g. AC Repair & Installation Service',
    priceLabel: 'Rate',
    pricePlaceholder: 'e.g. 2,000/hour or by quote',
    // Services allows a personal path (individual tutor / casual help) — not business-only.
    images: { required: false, min: 0, max: 10, label: 'Showcase your previous work with portfolio images (optional).' },
    subcategories: [
      { slug: 'tutors', label: 'Tutors' }, { slug: 'repair', label: 'Repair' },
      { slug: 'freelance', label: 'Freelance' }, { slug: 'cleaning', label: 'Cleaning' },
      { slug: 'professional', label: 'Professional Services' },
    ],
    fields: [
      { name: 'serviceType',  label: 'Service Type',        type: 'text',   required: true, placeholder: 'e.g. AC Repair, Plumbing, Tutoring', col: 1 },
      { name: 'experience',   label: 'Years of Experience', type: 'select',                 options: ['Less than 1 year','1–2 years','3–5 years','5–10 years','10+ years'], col: 1 },
      { name: 'serviceArea',  label: 'Service Area',        type: 'text',                   placeholder: 'e.g. Malir Cantt, DHA Phase 8', col: 1 },
      { name: 'availability', label: 'Availability',        type: 'select',                 options: ['Weekdays','Weekends','All Days','By Appointment'], col: 1 },
      { name: 'pricingType',  label: 'Pricing Type',        type: 'select', required: true, options: ['Hourly','Fixed','Negotiable'], col: 2 },
    ],
  },

  food: {
    label: 'Food',
    titlePlaceholder: 'e.g. Homemade Lasagna & Desserts',
    priceLabel: 'Price',
    pricePlaceholder: 'e.g. 1,500 or by order',
    businessOnly: true,
    images: { required: true, min: 1, max: 10, label: 'Appetising photos sell food — show your dishes.' },
    subcategories: [
      { slug: 'home-food', label: 'Home Food' }, { slug: 'baking', label: 'Baking' },
      { slug: 'catering', label: 'Catering' }, { slug: 'meal-prep', label: 'Meal Prep' },
    ],
    fields: [
      { name: 'foodType',          label: 'Food Type',              type: 'text',   required: true, placeholder: 'e.g. Desserts, Frozen, Meal Prep', col: 1 },
      { name: 'specialty',         label: 'Specialty',              type: 'text',                   placeholder: 'e.g. Lasagna, Brownies',           col: 1 },
      { name: 'deliveryAvailable', label: 'Delivery Available',     type: 'select', required: true, options: ['Yes','No'],                            col: 1 },
      { name: 'pickupAvailable',   label: 'Pickup Available',       type: 'select', required: true, options: ['Yes','No'],                            col: 1 },
      { name: 'advanceOrder',      label: 'Advance Order Required', type: 'select',                 options: ['Yes','No'],                            col: 1 },
    ],
  },

  jobs: {
    label: 'Jobs',
    titlePlaceholder: 'e.g. English Teacher Required',
    priceLabel: 'Salary',
    pricePlaceholder: 'e.g. 50,000 or Negotiable',
    images: { required: false, min: 0, max: 10, label: 'Upload a company logo or hiring images (optional).' },
    subcategories: [
      { slug: 'full-time', label: 'Full Time' }, { slug: 'part-time', label: 'Part Time' },
      { slug: 'internship', label: 'Internship' },
    ],
    fields: [
      { name: 'companyName', label: 'Company Name',                    type: 'text',   required: true, placeholder: 'e.g. Malir Academy',   col: 1 },
      { name: 'position',    label: 'Position',                        type: 'text',   required: true, placeholder: 'e.g. English Teacher', col: 1 },
      { name: 'jobType',     label: 'Job Type',                        type: 'select', required: true, options: ['Full Time','Part Time','Contract','Internship'], col: 1 },
      { name: 'experience',  label: 'Experience Required',             type: 'select', required: true, options: ['Fresher / No Experience','1 Year','2 Years','3–5 Years','5+ Years'], col: 1 },
      { name: 'education',   label: 'Education Required',              type: 'select',                 options: ['No Requirement','Matric','Intermediate',"Bachelor's","Master's",'PhD'], col: 1 },
      { name: 'deadline',    label: 'Application Deadline (optional)', type: 'date',                   col: 1 },
    ],
  },

  fitness: {
    label: 'Fitness',
    titlePlaceholder: 'e.g. Commercial Treadmill — Like New',
    priceLabel: 'Price',
    pricePlaceholder: 'e.g. 1,20,000',
    images: { required: true, min: 1, max: 10, label: null },
    subcategories: [
      { slug: 'equipment', label: 'Equipment' }, { slug: 'memberships', label: 'Memberships' },
      { slug: 'supplements', label: 'Supplements' }, { slug: 'activewear', label: 'Activewear' },
    ],
    fields: [
      { name: 'equipmentType', label: 'Item / Equipment Type', type: 'text',   required: true, placeholder: 'e.g. Treadmill, Whey Protein, Gym Wear', col: 1 },
      { name: 'brand',         label: 'Brand',               type: 'text',                   placeholder: 'e.g. LifeFitness',                       col: 1 },
      { name: 'condition',     label: 'Condition',           type: 'select', required: true, options: STD_CONDITION,                                col: 1 },
      { name: 'weightSize',    label: 'Weight / Size',       type: 'text',                   placeholder: 'e.g. 100kg capacity, 5kg pair',          col: 1 },
      { name: 'usage',         label: 'Use Type',            type: 'select',                 options: ['Home Use','Commercial Use'],                 col: 1 },
      { name: 'warranty',      label: 'Warranty (optional)', type: 'text',                   placeholder: 'e.g. 6 months remaining',                col: 1 },
    ],
  },

  other: {
    label: 'Other',
    titlePlaceholder: 'What are you listing?',
    priceLabel: 'Price',
    pricePlaceholder: 'e.g. 2,000',
    images: { required: false, min: 0, max: 10, label: 'Add photos (optional).' },
    subcategories: [],
    fields: [
      { name: 'condition', label: 'Condition', type: 'select', options: ['New','Like New','Used','For Parts'], col: 1 },
    ],
  },
};
