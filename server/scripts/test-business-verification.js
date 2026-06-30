// Checks for the business verification application (schema + doc storage).
// No DB/network — run: node scripts/test-business-verification.js
import assert from 'node:assert/strict';
import { businessApplySchema } from '../src/validators/schemas.js';
import { storeImageBufferDetailed } from '../src/lib/imageStorage.js';

let passed = 0;
const ok = (l) => { passed++; console.log('  ✓', l); };

// ── Field schema (text fields arrive via multipart) ───────────────────────────
const good = businessApplySchema.parse({
  businessName: 'Malir Motors', businessType: 'automotive',
  businessAddress: 'Shop 4, Saba Avenue, Malir Cantt', businessPhone: '0301-2345678', ntnNumber: '',
});
assert.equal(good.businessName, 'Malir Motors');
assert.equal(good.businessAddress, 'Shop 4, Saba Avenue, Malir Cantt');
assert.equal(good.ntnNumber, undefined); // '' normalised away
ok('schema accepts valid application, empty NTN → undefined');

assert.equal(businessApplySchema.safeParse({ businessName: 'X', businessAddress: 'a', businessPhone: 'nope' }).success, false);
ok('schema rejects short name / short address / bad phone');

assert.equal(businessApplySchema.safeParse({ businessName: 'Malir Motors', businessPhone: '0301-2345678' }).success, false);
ok('schema requires business address');

// ── Doc storage (Cloudinary disabled → dev fallback returns {url, publicId}) ──
const out = await storeImageBufferDetailed({ buffer: Buffer.from('img-bytes'), mimetype: 'image/jpeg', size: 9 }, { folder: 'business-verification' });
assert.ok(out.url.startsWith('data:image/jpeg;base64,'));
assert.equal(out.publicId, null);
ok('storeImageBufferDetailed returns {url, publicId} (dev fallback)');

await assert.rejects(() => storeImageBufferDetailed({ buffer: Buffer.alloc(0), mimetype: 'image/jpeg' }), /could not be uploaded/i);
ok('storeImageBufferDetailed rejects empty buffer');

console.log(`\nAll ${passed} business-verification checks passed.`);
