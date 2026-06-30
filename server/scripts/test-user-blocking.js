// Checks for admin user-blocking validation + the shared message.
// No DB — run: node scripts/test-user-blocking.js
import assert from 'node:assert/strict';
import { blockUserSchema } from '../src/validators/schemas.js';
import { ACCOUNT_BLOCKED_MESSAGE } from '../src/middleware/auth.js';

let passed = 0;
const ok = (l) => { passed++; console.log('  ✓', l); };

assert.equal(blockUserSchema.parse({}).reason, undefined);
ok('reason optional (no body)');

assert.equal(blockUserSchema.parse({ reason: '' }).reason, undefined);
ok('empty reason → undefined');

assert.equal(blockUserSchema.parse({ reason: 'spam / fake listings' }).reason, 'spam / fake listings');
ok('reason kept when provided');

assert.equal(blockUserSchema.safeParse({ reason: 'x'.repeat(501) }).success, false);
ok('reason capped at 500');

assert.match(ACCOUNT_BLOCKED_MESSAGE, /restricted/i);
ok('blocked message present');

console.log(`\nAll ${passed} user-blocking checks passed.`);
