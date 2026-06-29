// Self-contained checks for the multipart image-upload path (fix/listing-images).
// No test framework in this project — run directly:
//   node scripts/test-image-validation.js
// Runs with Cloudinary DISABLED (no network), exercising validation + dev fallback.
import assert from 'node:assert/strict';
import { listingCreateFieldsSchema, listingUpdateFieldsSchema } from '../src/validators/schemas.js';
import { storeImage, storeImageBuffer, __test__ } from '../src/lib/imageStorage.js';

const { assertPlausibleImageInput } = __test__;

const REAL_DATA_URL = 'data:image/jpeg;base64,' + 'A'.repeat(6000);
const BLANK_DATA_URL = 'data:image/jpeg;base64,' + 'A'.repeat(600);
const HTTPS_URL = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

let passed = 0;
const ok = (label) => { passed++; console.log('  ✓', label); };

// ── Field schema: multipart text fields arrive as strings ─────────────────────
const c = listingCreateFieldsSchema.parse({
  title: 'Test title', description: 'A long enough description.',
  category: 'vehicles', price: '150000', featuredRequested: 'true',
  details: JSON.stringify({ make: 'Toyota', year: '2018' }),
});
assert.equal(c.price, 150000);
assert.equal(typeof c.price, 'number');
assert.equal(c.featuredRequested, true);
assert.deepEqual(c.details, { make: 'Toyota', year: '2018' });
ok('create schema coerces price/featuredRequested + parses details JSON');

assert.equal(listingCreateFieldsSchema.safeParse({ title: 'x', description: 'y', category: 'vehicles', price: 'abc' }).success, false);
ok('create schema rejects bad title/short desc/non-numeric price');

const u = listingUpdateFieldsSchema.parse({
  price: '999',
  imagesOrder: JSON.stringify([{ kind: 'kept', url: HTTPS_URL }, { kind: 'new', idx: 0 }]),
});
assert.equal(u.price, 999);
assert.equal(u.imagesOrder.length, 2);
assert.equal(u.imagesOrder[1].kind, 'new');
ok('update schema parses imagesOrder (kept + new)');

assert.equal(
  listingUpdateFieldsSchema.safeParse({ imagesOrder: JSON.stringify([{ kind: 'bogus' }]) }).success,
  false,
);
ok('update schema rejects malformed imagesOrder entry');

// ── storeImageBuffer (Cloudinary disabled → dev base64 fallback) ──────────────
const fakeFile = { buffer: Buffer.from('hello-image-bytes'), mimetype: 'image/png', size: 17 };
const out = await storeImageBuffer(fakeFile);
assert.ok(out.startsWith('data:image/png;base64,'), 'dev fallback returns data URL');
ok('storeImageBuffer returns base64 data URL when Cloudinary disabled');

await assert.rejects(() => storeImageBuffer({ buffer: Buffer.alloc(0), mimetype: 'image/png' }), /could not be uploaded/i);
ok('storeImageBuffer rejects empty buffer');

await assert.rejects(() => storeImageBuffer(undefined), /could not be uploaded/i);
ok('storeImageBuffer rejects missing file');

// ── storeImage (kept-URL passthrough used by Edit) ────────────────────────────
assert.equal(await storeImage(HTTPS_URL), HTTPS_URL);
ok('storeImage passes kept https URL unchanged');

await assert.rejects(() => storeImage(BLANK_DATA_URL), /could not be uploaded/i);
ok('storeImage still rejects blank/tiny data URL');

assert.throws(() => assertPlausibleImageInput(''));
assert.doesNotThrow(() => assertPlausibleImageInput(REAL_DATA_URL));
ok('assertPlausibleImageInput guards empty vs real');

console.log(`\nAll ${passed} multipart image checks passed.`);
