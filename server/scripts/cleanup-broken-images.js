// Find (and optionally remove) blank/broken listing images created by the old
// client canvas bug — tiny base64 rows in the DB and tiny Cloudinary assets.
//
// SAFE BY DEFAULT: with no flags it only REPORTS. It never touches admin-owned
// data, and only deletes when you explicitly pass --delete.
//
//   node scripts/cleanup-broken-images.js              # report only
//   node scripts/cleanup-broken-images.js --delete     # delete broken DB images + their Cloudinary assets
//   node scripts/cleanup-broken-images.js --delete --prune-empty-listings
//                                                       # also delete listings left with 0 images (non-admin only)
//
// "Broken" = an inline base64 data URL whose decoded size is below MIN_IMAGE_BYTES.
// Cloudinary https URLs are checked via the Admin API (bytes/width) when CLOUDINARY_URL is set.
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../src/lib/prisma.js';
import { MIN_IMAGE_BYTES } from '../src/lib/constants.js';

const DELETE = process.argv.includes('--delete');
const PRUNE_EMPTY = process.argv.includes('--prune-empty-listings');
const CLOUDINARY_ENABLED = !!process.env.CLOUDINARY_URL;
if (CLOUDINARY_ENABLED) cloudinary.config({ secure: true });

function dataUrlByteLength(dataUrl) {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return 0;
  const b64 = dataUrl.slice(comma + 1);
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

// Pull public_id back out of a Cloudinary delivery URL (…/upload/v123/malir/listings/abc.jpg → malir/listings/abc)
function publicIdFromUrl(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
  return m ? m[1] : null;
}

async function isBrokenCloudinaryAsset(url) {
  if (!CLOUDINARY_ENABLED) return false; // can't verify without creds — leave alone
  const publicId = publicIdFromUrl(url);
  if (!publicId) return false;
  try {
    const info = await cloudinary.api.resource(publicId);
    return !(info.width > 0) || !(info.height > 0) || !(info.bytes >= MIN_IMAGE_BYTES);
  } catch {
    return false; // asset missing or API error — don't assume broken
  }
}

async function main() {
  const images = await prisma.listingImage.findMany({
    include: { listing: { select: { id: true, title: true, user: { select: { role: true, email: true } } } } },
  });

  const broken = [];
  for (const img of images) {
    if (img.listing?.user?.role === 'admin') continue; // never touch admin data
    const url = img.imageUrl || '';
    let bad = false;
    if (url.startsWith('data:image/')) bad = dataUrlByteLength(url) < MIN_IMAGE_BYTES;
    else if (/^https?:\/\//i.test(url)) bad = await isBrokenCloudinaryAsset(url);
    else bad = !url.trim();
    if (bad) broken.push(img);
  }

  console.log(`Scanned ${images.length} images. Found ${broken.length} broken/blank (non-admin).`);
  for (const img of broken) {
    const kind = img.imageUrl.startsWith('data:') ? 'inline-base64' : 'cloudinary';
    console.log(`  image#${img.id} listing#${img.listingId} "${img.listing?.title ?? '?'}" [${kind}]`);
  }

  if (!broken.length) { await prisma.$disconnect(); return; }
  if (!DELETE) {
    console.log('\nReport only. Re-run with --delete to remove these.');
    await prisma.$disconnect();
    return;
  }

  for (const img of broken) {
    if (CLOUDINARY_ENABLED && /^https?:\/\//i.test(img.imageUrl)) {
      const pid = publicIdFromUrl(img.imageUrl);
      if (pid) { try { await cloudinary.uploader.destroy(pid); } catch { /* ignore */ } }
    }
    await prisma.listingImage.delete({ where: { id: img.id } });
  }
  console.log(`Deleted ${broken.length} broken images.`);

  if (PRUNE_EMPTY) {
    const affected = [...new Set(broken.map((b) => b.listingId))];
    let pruned = 0;
    for (const listingId of affected) {
      const l = await prisma.listing.findUnique({
        where: { id: listingId },
        include: { _count: { select: { images: true } }, user: { select: { role: true } } },
      });
      if (l && l.user.role !== 'admin' && l._count.images === 0) {
        await prisma.listing.delete({ where: { id: listingId } });
        pruned++;
      }
    }
    console.log(`Pruned ${pruned} listings left with 0 images.`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
