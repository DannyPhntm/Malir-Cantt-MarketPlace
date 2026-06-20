import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateCode, codeExpiry } from '../src/lib/codes.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database…');

  // Clean slate (children first to respect FKs even without cascade).
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.businessAccount.deleteMany();
  await prisma.emailVerificationCode.deleteMany();
  await prisma.passwordResetCode.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // ── Admin (for the moderation panel) ─────────────────────────────────────────
  // Password from ADMIN_PASSWORD, else the documented dev default. Admin accounts
  // exist ONLY via the seed or scripts/create-admin.js — never public sign-up.
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@malircantt.pk').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  await prisma.user.create({
    data: {
      name: 'Marketplace Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      phone: '0300-0000000',
      residentLocation: 'Malir Cantt',
      accountType: 'personal',
      role: 'admin',
      emailVerified: true,
    },
  });

  // ── Users ──────────────────────────────────────────────────────────────────
  const ahmed = await prisma.user.create({
    data: {
      name: 'Ahmed Khan',
      email: 'ahmed.khan@example.com',
      passwordHash,
      phone: '0300-1234567',
      canttPassNumber: 'MC-10293',
      residentLocation: 'Malir Cantt, Sector B',
      accountType: 'personal',
      emailVerified: true,
    },
  });

  const fatima = await prisma.user.create({
    data: {
      name: 'Fatima Interiors',
      email: 'fatima.interiors@example.com',
      passwordHash,
      phone: '0321-9988776',
      residentLocation: 'Malir Cantt Gate 1',
      accountType: 'business',
      emailVerified: true,
      businessVerified: true,
      businessAccount: {
        create: { businessName: 'Fatima Interiors', businessType: 'home-decor', sellerStatus: 'approved', paymentStatus: 'waived' },
      },
    },
  });

  const techhire = await prisma.user.create({
    data: {
      name: 'TechHire PK',
      email: 'hr@techhire.pk',
      passwordHash,
      phone: '0322-9988776',
      residentLocation: 'Malir Cantt',
      accountType: 'business',
      emailVerified: true,
      // Applied but NOT yet approved — businessVerified stays false.
      businessAccount: {
        create: { businessName: 'TechHire PK', businessType: 'services', sellerStatus: 'pending', paymentStatus: 'payment_required' },
      },
    },
  });

  // ── Listings ─────────────────────────────────────────────────────────────────
  // Vehicle — requires images (approved + featured active).
  await prisma.listing.create({
    data: {
      userId: ahmed.id,
      title: 'Honda City 2020 — Excellent Condition',
      description:
        'Well-maintained Honda City 2020 in pearl white. Single owner, full service history. No accidents. Only 28,000 km driven. Available for inspection at Malir Cantt.',
      category: 'vehicles',
      price: 3800000,
      featuredRequested: true,
      featuredActive: true,
      status: 'approved',
      details: JSON.stringify({
        make: 'Honda', model: 'City', year: '2020', mileage: '28,000 km',
        fuelType: 'Petrol', transmission: 'Automatic', condition: 'Like New', colour: 'Pearl White',
      }),
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200&q=85', displayOrder: 0 },
          { imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85', displayOrder: 1 },
        ],
      },
    },
  });

  // Furniture — requires images (business seller, approved).
  await prisma.listing.create({
    data: {
      userId: fatima.id,
      title: 'Solid Sheesham Wood Dining Table — 6 Seater',
      description:
        'Handcrafted sheesham dining table with six chairs. Premium polish finish. Custom sizes available. Delivery within Malir Cantt included.',
      category: 'home-living',
      subcategory: 'furniture',
      postingType: 'business',
      price: 85000,
      status: 'approved',
      details: JSON.stringify({
        furnitureType: 'Dining Table', material: 'Wood', condition: 'New', dimensions: '180 × 90 cm',
      }),
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=1200&q=85', displayOrder: 0 },
        ],
      },
    },
  });

  // Jobs — images optional, so this listing has none (exercises the rule).
  await prisma.listing.create({
    data: {
      userId: techhire.id,
      title: 'Senior Software Engineer — Remote',
      description:
        'Hiring a Senior Software Engineer. Remote-first role. 5+ years in Node.js or React required. Competitive salary, health insurance, annual bonus.',
      category: 'jobs',
      price: 180000,
      status: 'pending',
      details: JSON.stringify({
        companyName: 'TechHire PK', position: 'Senior Software Engineer',
        jobType: 'Full Time', experience: '5+ Years', education: "Bachelor's",
      }),
      // no images
    },
  });

  // Services — images optional, none here.
  await prisma.listing.create({
    data: {
      userId: fatima.id,
      title: 'Home Renovation & Painting',
      description:
        'Professional home renovation, painting, tiling, and plumbing. 15 years experience in Malir Cantt. Free estimate visit. 1-year work guarantee.',
      category: 'services',
      subcategory: 'repair',
      postingType: 'business',
      price: 150,
      status: 'approved',
      details: JSON.stringify({
        serviceType: 'Home Renovation & Painting', experience: '10+ years',
        serviceArea: 'Malir Cantt', availability: 'All Days', pricingType: 'Negotiable',
      }),
    },
  });

  // Food & Home Kitchen — business-only category (Fatima is an approved business).
  await prisma.listing.create({
    data: {
      userId: fatima.id,
      title: 'Homemade Lasagna, Brownies & Party Platters',
      description:
        'Freshly prepared homemade lasagna, fudgy brownies, and custom party platters. Made to order with quality ingredients. Advance order required for large quantities. Delivery within Malir Cantt.',
      category: 'food',
      subcategory: 'home-food',
      postingType: 'business',
      price: 1500,
      status: 'approved',
      details: JSON.stringify({
        foodType: 'Desserts & Meals', specialty: 'Lasagna, Brownies, Platters',
        deliveryAvailable: 'Yes', pickupAvailable: 'Yes', advanceOrder: 'Yes',
      }),
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=1200&q=85', displayOrder: 0 },
        ],
      },
    },
  });

  // ── A live verification code for manual testing ──────────────────────────────
  const demoCode = generateCode();
  await prisma.emailVerificationCode.create({
    data: { email: 'newuser@example.com', code: demoCode, expiresAt: codeExpiry() },
  });

  const counts = {
    users: await prisma.user.count(),
    listings: await prisma.listing.count(),
    images: await prisma.listingImage.count(),
    businessAccounts: await prisma.businessAccount.count(),
  };
  console.log('Seed complete:', counts);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log(`Demo login: ahmed.khan@example.com / password123`);
  console.log(`Demo verification code for newuser@example.com: ${demoCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
