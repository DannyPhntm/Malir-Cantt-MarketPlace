import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateCode, codeExpiry } from '../src/lib/codes.js';

const prisma = new PrismaClient();

// Clean, beta-ready seed: 1 admin, a few residents, a few APPROVED business
// sellers (+ one pending for the admin queue), and realistic listings across the
// main categories. Idempotent — wipes and recreates.
async function main() {
  console.log('Seeding database…');

  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.savedListing.deleteMany();
  await prisma.businessAccount.deleteMany();
  await prisma.emailVerificationCode.deleteMany();
  await prisma.passwordResetCode.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash('password123', 10);
  const img = (url, i = 0) => ({ imageUrl: `${url}?w=1200&q=80&fit=crop`, displayOrder: i });

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@malircantt.pk').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  await prisma.user.create({
    data: {
      name: 'Marketplace Admin', email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 10),
      phone: '0300-0000000', residentLocation: 'Malir Cantt', accountType: 'personal',
      role: 'admin', emailVerified: true,
    },
  });

  // ── Residents (personal accounts) ───────────────────────────────────────────
  const ahmed = await prisma.user.create({
    data: { name: 'Ahmed Khan', email: 'ahmed.khan@example.com', passwordHash: pw, phone: '0300-1234567',
      canttPassNumber: 'MC-10293', residentLocation: 'Malir Cantt, Sector B', accountType: 'personal', emailVerified: true },
  });
  const sara = await prisma.user.create({
    data: { name: 'Sara Malik', email: 'sara.malik@example.com', passwordHash: pw, phone: '0301-2233445',
      canttPassNumber: 'MC-20881', residentLocation: 'Malir Cantt, Gate 2', accountType: 'personal', emailVerified: true },
  });
  const bilal = await prisma.user.create({
    data: { name: 'Bilal Ahmed', email: 'bilal.ahmed@example.com', passwordHash: pw, phone: '0302-7788990',
      residentLocation: 'Malir Cantt, Sector A', accountType: 'personal', emailVerified: true },
  });

  // ── Approved business sellers (sellerStatus approved + payment waived) ────────
  const mkBiz = (name, email, phone, businessType) => ({
    name, email, passwordHash: pw, phone, residentLocation: 'Malir Cantt', accountType: 'business',
    emailVerified: true, businessVerified: true,
    businessAccount: { create: { businessName: name, businessType, sellerStatus: 'approved', paymentStatus: 'waived' } },
  });
  const fatima = await prisma.user.create({ data: mkBiz('Fatima Interiors', 'fatima.interiors@example.com', '0321-9988776', 'home-decor') });
  const eats = await prisma.user.create({ data: mkBiz('Karachi Eats', 'hello@karachieats.pk', '0333-4455667', 'food-beverage') });
  const techzone = await prisma.user.create({ data: mkBiz('TechZone', 'sales@techzone.pk', '0345-1212121', 'electronics') });

  // ── One PENDING business (for the admin Business Seller queue) ────────────────
  await prisma.user.create({
    data: { name: 'TechHire PK', email: 'hr@techhire.pk', passwordHash: pw, phone: '0322-9988776',
      residentLocation: 'Malir Cantt', accountType: 'business', emailVerified: true,
      businessAccount: { create: { businessName: 'TechHire PK', businessType: 'services', sellerStatus: 'pending', paymentStatus: 'payment_required' } } },
  });

  // ── Listings across the main categories ──────────────────────────────────────
  const L = (data) => prisma.listing.create({ data });

  // Vehicles — personal, featured
  await L({ userId: ahmed.id, title: 'Honda City 2021 — Automatic, Pearl White', category: 'vehicles', subcategory: 'cars',
    postingType: 'personal', price: 4200000, status: 'approved', featuredRequested: true, featuredActive: true,
    description: 'Single owner, full service history, 31,000 km. Pristine condition. Inspection welcome at Malir Cantt.',
    details: JSON.stringify({ make: 'Honda', model: 'City', year: '2021', mileage: '31,000 km', fuelType: 'Petrol', transmission: 'Automatic', condition: 'Like New', colour: 'Pearl White' }),
    images: { create: [img('https://images.unsplash.com/photo-1619767886558-efdc259cde1a', 0)] } });

  // Property — personal
  await L({ userId: sara.id, title: '2 Bedroom Apartment for Rent — Malir Cantt', category: 'property', subcategory: 'apartments',
    postingType: 'personal', price: 65000, status: 'approved',
    description: 'Bright 2-bed apartment near Gate 2. Family building, 24/7 security, dedicated parking. Available immediately.',
    details: JSON.stringify({ propertyType: 'Apartment', listingType: 'For Rent', bedrooms: '2', bathrooms: '2', area: '1,050 sq ft', furnished: 'Semi-Furnished', parking: 'Yes' }),
    images: { create: [img('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', 0)] } });

  // Electronics — business (TechZone, approved)
  await L({ userId: techzone.id, title: 'iPhone 15 Pro Max 256GB — Boxed, Warranty', category: 'electronics', subcategory: 'phones',
    postingType: 'business', price: 415000, status: 'approved',
    description: 'Brand new, sealed, PTA-approved. 1-year official warranty. Bulk available. Delivery across Malir Cantt.',
    details: JSON.stringify({ brand: 'Apple', model: 'iPhone 15 Pro Max', condition: 'New', warranty: '1 Year', storage: '256GB' }),
    images: { create: [img('https://images.unsplash.com/photo-1592750475338-74b7b21085ab', 0)] } });

  // Home & Living — business (Fatima, approved), featured
  await L({ userId: fatima.id, title: 'Handcrafted Sheesham Dining Set — 6 Seater', category: 'home-living', subcategory: 'furniture',
    postingType: 'business', price: 95000, status: 'approved', featuredRequested: true, featuredActive: true,
    description: 'Solid sheesham wood, premium polish. Custom sizes available. Free delivery within Malir Cantt.',
    details: JSON.stringify({ itemType: 'Dining Table', material: 'Wood', condition: 'New', dimensions: '180 × 90 cm' }),
    images: { create: [img('https://images.unsplash.com/photo-1577140917170-285929fb55b7', 0)] } });

  // Home decor — business (Fatima)
  await L({ userId: fatima.id, title: 'Handmade Ceramic Vases & Wall Art', category: 'home-living', subcategory: 'home-decor',
    postingType: 'business', price: 3500, status: 'approved',
    description: 'Locally handmade décor pieces. Made to order in custom colours. Perfect for living rooms and gifts.',
    details: JSON.stringify({ itemType: 'Vases & Wall Art', material: 'Ceramic', condition: 'New' }),
    images: { create: [img('https://images.unsplash.com/photo-1493106641515-6b5631de4bb9', 0)] } });

  // Fashion — personal
  await L({ userId: bilal.id, title: 'Nike Air Jordan 1 High OG — UK 9', category: 'fashion', subcategory: 'shoes',
    postingType: 'personal', price: 22000, status: 'approved',
    description: 'Worn twice, like new with original box. Authentic. No trades.',
    details: JSON.stringify({ brand: 'Nike', itemType: 'Sneakers', size: 'UK 9', gender: 'Men', condition: 'Like New', colour: 'Black / Red' }),
    images: { create: [img('https://images.unsplash.com/photo-1542291026-7eec264c27ff', 0)] } });

  // Services — business (Fatima, approved) — services is a forced-business category
  await L({ userId: fatima.id, title: 'Home Renovation, Painting & Interior Work', category: 'services', subcategory: 'repair',
    postingType: 'business', price: 0, status: 'approved',
    description: 'Full home renovation, painting, tiling and interior fit-outs. 15 years in Malir Cantt. Free estimate, 1-year work guarantee.',
    details: JSON.stringify({ serviceType: 'Renovation & Painting', experience: '10+ years', serviceArea: 'Malir Cantt', availability: 'All Days', pricingType: 'Negotiable' }) });

  // Food — business (Karachi Eats, approved), featured — food is forced-business
  await L({ userId: eats.id, title: 'Homemade Biryani & BBQ Platters — To Order', category: 'food', subcategory: 'home-food',
    postingType: 'business', price: 1800, status: 'approved', featuredRequested: true, featuredActive: true,
    description: 'Fresh chicken & beef biryani, BBQ platters and party orders. Made to order with quality ingredients. Advance order for large quantities. Delivery in Malir Cantt.',
    details: JSON.stringify({ foodType: 'Biryani & BBQ', specialty: 'Chicken Biryani, Seekh Kebab', deliveryAvailable: 'Yes', pickupAvailable: 'Yes', advanceOrder: 'Yes' }),
    images: { create: [img('https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a', 0)] } });

  // Jobs — business posting by an approved seller (jobs aren't gated, but TechZone is hiring)
  await L({ userId: techzone.id, title: 'Frontend Developer (React) — On-site, Malir', category: 'jobs', subcategory: 'full-time',
    postingType: 'business', price: 150000, status: 'approved',
    description: 'Hiring a React developer. 2+ years experience. On-site at our Malir Cantt office. Competitive salary + benefits.',
    details: JSON.stringify({ companyName: 'TechZone', position: 'Frontend Developer', jobType: 'Full Time', experience: '2 Years', education: "Bachelor's" }) });

  // Fitness — personal
  await L({ userId: bilal.id, title: 'Commercial Treadmill — Excellent Condition', category: 'fitness', subcategory: 'equipment',
    postingType: 'personal', price: 110000, status: 'approved',
    description: 'Heavy-duty treadmill, lightly used. 120kg capacity, incline + programs. Pickup from Sector A.',
    details: JSON.stringify({ equipmentType: 'Treadmill', brand: 'LifeFitness', condition: 'Like New', weightSize: '120kg capacity', usage: 'Home Use' }),
    images: { create: [img('https://images.unsplash.com/photo-1534438327276-14e5300c3a48', 0)] } });

  // One PENDING listing (for the admin moderation queue)
  await L({ userId: sara.id, title: 'Study Desk & Chair — Wooden', category: 'home-living', subcategory: 'furniture',
    postingType: 'personal', price: 12000, status: 'pending',
    description: 'Compact wooden study desk with chair. Good condition, minor scratches. Pickup only.',
    details: JSON.stringify({ itemType: 'Study Desk', material: 'Wood', condition: 'Good' }),
    images: { create: [img('https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd', 0)] } });

  const demoCode = generateCode();
  await prisma.emailVerificationCode.create({ data: { email: 'newuser@example.com', code: demoCode, expiresAt: codeExpiry() } });

  const counts = {
    users: await prisma.user.count(),
    businesses: await prisma.businessAccount.count(),
    approvedSellers: await prisma.businessAccount.count({ where: { sellerStatus: 'approved' } }),
    listings: await prisma.listing.count(),
    approvedListings: await prisma.listing.count({ where: { status: 'approved' } }),
    featured: await prisma.listing.count({ where: { featuredActive: true } }),
  };
  console.log('Seed complete:', counts);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log('Demo logins (password123): ahmed.khan@example.com (resident), fatima.interiors@example.com (business seller)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
