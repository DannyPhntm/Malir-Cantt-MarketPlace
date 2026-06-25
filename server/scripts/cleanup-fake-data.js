// Remove the demo/fake seed data from a database (e.g. production Neon), keeping
// real accounts and a secure admin. SAFE BY DEFAULT: a dry run that only PRINTS
// what would be deleted. Pass CONFIRM_DELETE=yes to actually delete.
//
// Usage:
//   node scripts/cleanup-fake-data.js                 # dry run (prints plan)
//   CONFIRM_DELETE=yes node scripts/cleanup-fake-data.js   # actually delete
//
// Deletes the known demo accounts below (and CASCADES their listings, business
// accounts and saved rows). The weak default admin (admin@malircantt.pk) is only
// removed if ANOTHER admin exists — so you can never lock yourself out. Run
// scripts/create-prod-admin.js and verify login FIRST.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Known demo/fake accounts created by the local dev seed.
const DEMO_EMAILS = [
  'ahmed.khan@example.com',     // Ahmed (resident)
  'sara.malik@example.com',     // Sara (resident)
  'bilal.ahmed@example.com',    // Bilal (resident)
  'fatima.interiors@example.com', // Fatima Interiors (business)
  'hello@karachieats.pk',       // Karachi Eats (business)
  'sales@techzone.pk',          // TechZone (business)
  'hr@techhire.pk',             // TechHire (pending business)
  'newuser@example.com',        // demo verification-code holder (no user row, but codes)
];
const WEAK_DEFAULT_ADMIN = 'admin@malircantt.pk';

async function main() {
  const confirm = process.env.CONFIRM_DELETE === 'yes';
  console.log(confirm ? '⚠  CONFIRM_DELETE=yes — DELETING demo data.\n' : 'DRY RUN — nothing will be deleted. Set CONFIRM_DELETE=yes to delete.\n');

  const demo = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true, email: true, name: true, role: true, _count: { select: { listings: true } } },
  });
  console.log('Demo accounts found:');
  for (const u of demo) console.log(`  - ${u.email}  (${u.name}, ${u._count.listings} listings)`);
  if (demo.length === 0) console.log('  (none)');

  // Weak default admin: only deletable if another admin remains.
  const otherAdmins = await prisma.user.count({ where: { role: 'admin', email: { not: WEAK_DEFAULT_ADMIN } } });
  const weak = await prisma.user.findUnique({ where: { email: WEAK_DEFAULT_ADMIN }, select: { email: true } });
  const canDeleteWeak = !!weak && otherAdmins > 0;
  console.log(`\nWeak default admin (${WEAK_DEFAULT_ADMIN}): ${weak ? (canDeleteWeak ? 'will be removed (another admin exists)' : 'KEPT — no other admin exists; create a secure admin first') : 'not present'}`);

  if (!confirm) { console.log('\nDry run complete. Re-run with CONFIRM_DELETE=yes to apply.'); return; }

  const emailsToDelete = [...demo.map((u) => u.email)];
  if (canDeleteWeak) emailsToDelete.push(WEAK_DEFAULT_ADMIN);

  // Codes are keyed by email (no user FK), so clear those too.
  await prisma.emailVerificationCode.deleteMany({ where: { email: { in: [...emailsToDelete, 'newuser@example.com'] } } });
  await prisma.passwordResetCode.deleteMany({ where: { email: { in: emailsToDelete } } });
  const res = await prisma.user.deleteMany({ where: { email: { in: emailsToDelete } } }); // cascades listings/business/saved

  const remaining = await prisma.user.count();
  const admins = await prisma.user.count({ where: { role: 'admin' } });
  console.log(`\nDeleted ${res.count} accounts. Remaining users: ${remaining} (admins: ${admins}).`);
  if (admins === 0) console.error('⚠  WARNING: no admin remains — create one with scripts/create-prod-admin.js.');
}

main()
  .catch((e) => { console.error('[cleanup-fake-data]', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
