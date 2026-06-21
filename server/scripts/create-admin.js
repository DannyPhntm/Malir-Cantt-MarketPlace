// Create (or rotate) the marketplace admin account WITHOUT wiping data.
//
// Admin accounts can only be created here or in the seed — never through public
// registration (the register endpoint has no role field, and no schema lets an
// account change its own role). This is the "manual database creation" path.
//
// Usage:
//   node scripts/create-admin.js
//   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='StrongPass123' node scripts/create-admin.js
//
// If ADMIN_PASSWORD is unset, a strong random password is generated and printed.

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 16-char password from a safe alphabet (no ambiguous chars).
function strongPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  return Array.from(crypto.randomBytes(16), (b) => alphabet[b % alphabet.length]).join('');
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@malircantt.pk').toLowerCase().trim();
  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || strongPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  // Upsert keeps existing data intact — only the admin row is created/rotated.
  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'admin', emailVerified: true },
    create: {
      name: 'Marketplace Admin',
      email,
      passwordHash,
      phone: '0300-0000000',
      residentLocation: 'Malir Cantt',
      accountType: 'personal',
      role: 'admin',
      emailVerified: true,
    },
  });

  console.log('\n────────────────────────────────────────────────');
  console.log('  Admin account ready (role: admin)');
  console.log('  ────────────────────────────────────────────');
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${password}`);
  if (generated) {
    console.log('  (generated — store it now; it is not recoverable)');
    console.log('  Override with ADMIN_PASSWORD=… to set your own.');
  }
  console.log('────────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
