import { CODE_TTL_MINUTES } from './constants.js';

// 6-digit numeric code (matches the frontend mock verification UI).
export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function codeExpiry(minutes = CODE_TTL_MINUTES) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isExpired(date) {
  return new Date(date).getTime() < Date.now();
}
