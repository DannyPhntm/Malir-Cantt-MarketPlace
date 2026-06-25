// Create (or rotate) the PRODUCTION admin — credentials come ONLY from the
// environment, never from defaults, and the password is never printed.
//
// Required env:
//   PROD_ADMIN_EMAIL     admin login email
//   PROD_ADMIN_PASSWORD  strong password (>= 12 chars)
//   PROD_ADMIN_NAME      display name (optional; defaults to "Marketplace Admin")
//
// Usage (e.g. a Railway one-off command, or locally against the prod DATABASE_URL):
//   PROD_ADMIN_EMAIL=you@domain.com PROD_ADMIN_PASSWORD='…' PROD_ADMIN_NAME='Your Name' \
//     node scripts/create-prod-admin.js
//
// After it succeeds: REMOVE PROD_ADMIN_PASSWORD from the Railway variables — it is
// only needed for this one-time run, and the bcrypt hash is already persisted.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function fail(msg) {
  console.error(`[create-prod-admin] ${msg}`);
  process.exit(1);
}

async function main() {
  const email = (process.env.PROD_ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.PROD_ADMIN_PASSWORD || '';
  const name = (process.env.PROD_ADMIN_NAME || 'Marketplace Admin').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail('PROD_ADMIN_EMAIL is missing or invalid.');
  }
  if (password.length < 12) {
    fail('PROD_ADMIN_PASSWORD is missing or too weak (need >= 12 characters).');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Upsert — never wipes other data; only creates/rotates this admin row.
  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: 'admin', emailVerified: true },
    create: {
      name, email, passwordHash,
      phone: '0300-0000000', residentLocation: 'Malir Cantt',
      accountType: 'personal', role: 'admin', emailVerified: true,
    },
  });

  // NB: the password is intentionally NOT printed.
  console.log('────────────────────────────────────────────────');
  console.log('  Production admin ready (role: admin, emailVerified: true)');
  console.log(`  Email: ${admin.email}`);
  console.log(`  Name:  ${admin.name}`);
  console.log('  → Now REMOVE PROD_ADMIN_PASSWORD from your Railway variables.');
  console.log('────────────────────────────────────────────────');
}

main()
  .catch((e) => { console.error('[create-prod-admin]', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
