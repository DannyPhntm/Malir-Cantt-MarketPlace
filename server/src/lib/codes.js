import crypto from 'node:crypto';
import { CODE_TTL_MINUTES } from './constants.js';

// Cryptographically-secure 6-digit numeric code (100000–999999). Uses
// crypto.randomInt (not Math.random) so codes aren't predictable.
export function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function codeExpiry(minutes = CODE_TTL_MINUTES) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isExpired(date) {
  return new Date(date).getTime() < Date.now();
}
