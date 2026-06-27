// Remove specific TEST user accounts by exact email (and all their owned data),
// so the emails can be reused. SAFE BY DEFAULT: a dry run that only prints a
// summary. Pass CONFIRM_DELETE=yes to actually delete.
//
// Emails are passed as CLI args (never hardcoded), e.g.:
//   node scripts/cleanup-test-users.js a@x.com b@y.com            # dry run
//   CONFIRM_DELETE=yes node scripts/cleanup-test-users.js a@x.com # delete
//
// Guards:
//  - Only the exact emails given are touched. No "delete all".
//  - Refuses to run if any matched account has role 'admin' (the secure admin
//    is never deleted). Schema/migrations are untouched.
//  - User deletion cascades to listings, business account, shop, and saved rows
//    (FK onDelete: Cascade); email-keyed codes are cleared explicitly.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emails = process.argv.slice(2).map((e) => e.toLowerCase().trim()).filter(Boolean);
  if (emails.length === 0) {
    console.error('Usage: node scripts/cleanup-test-users.js <email> [email...]   (CONFIRM_DELETE=yes to delete)');
    process.exit(1);
  }
  const confirm = process.env.CONFIRM_DELETE === 'yes';
  console.log(confirm ? '⚠  CONFIRM_DELETE=yes — DELETING the listed accounts.\n' : 'DRY RUN — nothing will be deleted. Set CONFIRM_DELETE=yes to delete.\n');
  console.log('Requested emails:', emails.join(', '), '\n');

  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: {
      id: true, email: true, role: true,
      businessAccount: { select: { sellerStatus: true, paymentStatus: true } },
      _count: { select: { listings: true, savedListings: true } },
    },
  });

  // Summary (safe fields only).
  console.log('Matched accounts:');
  for (const u of users) {
    const shops = await prisma.shop.count({ where: { userId: u.id } });
    console.log(
      `  - ${u.email} | role=${u.role}` +
      ` | business=${u.businessAccount ? u.businessAccount.sellerStatus + '/' + u.businessAccount.paymentStatus : 'none'}` +
      ` | listings=${u._count.listings} | shops=${shops} | saved=${u._count.savedListings}`,
    );
  }
  const foundEmails = users.map((u) => u.email);
  const notFound = emails.filter((e) => !foundEmails.includes(e));
  if (foundEmails.length === 0) console.log('  (none found)');
  if (notFound.length) console.log('\nNot found (no account):', notFound.join(', '));

  // Admin guard — never delete an admin via this script.
  const admins = users.filter((u) => u.role === 'admin');
  if (admins.length) {
    console.error(`\n✋ Refusing: ${admins.map((a) => a.email).join(', ')} has role 'admin'. The secure admin is never deleted by this script.`);
    process.exit(1);
  }

  if (!confirm) {
    console.log('\nDry run complete. Re-run with CONFIRM_DELETE=yes to delete the matched accounts.');
    return;
  }
  if (foundEmails.length === 0) { console.log('\nNothing to delete.'); return; }

  // Email-keyed codes have no FK to user — clear them for the requested emails.
  await prisma.emailVerificationCode.deleteMany({ where: { email: { in: emails } } });
  await prisma.passwordResetCode.deleteMany({ where: { email: { in: emails } } });
  // User delete cascades listings / business account / shop / saved listings.
  const res = await prisma.user.deleteMany({ where: { email: { in: foundEmails } } });

  console.log(`\nDeleted ${res.count} account(s): ${foundEmails.join(', ')}`);
  const stillThere = await prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true } });
  console.log('Remaining of requested emails:', stillThere.length ? stillThere.map((u) => u.email).join(', ') : 'none ✓');
  const adminCount = await prisma.user.count({ where: { role: 'admin' } });
  console.log(`Admin accounts intact: ${adminCount} (total users now: ${await prisma.user.count()})`);
}

main()
  .catch((e) => { console.error('[cleanup-test-users]', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
