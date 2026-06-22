import jwt from 'jsonwebtoken';

// JWT secret is mandatory. In production the server MUST refuse to start without
// it — an insecure default would let anyone forge admin tokens. In development a
// fallback is allowed but loudly warned so it can never slip into production.
const isProd = process.env.NODE_ENV === 'production';
let SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  if (isProd) {
    throw new Error(
      'JWT_SECRET is not set. Refusing to start in production with an insecure default — ' +
        'set a long random JWT_SECRET in the environment.',
    );
  }
  SECRET = 'dev-secret-change-me';
  // eslint-disable-next-line no-console
  console.warn(
    '[jwt] WARNING: JWT_SECRET is not set — using an INSECURE development fallback. ' +
      'Set JWT_SECRET in server/.env before deploying.',
  );
}

const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Sign a token for a user. Keep the payload minimal — id + role are enough to
// authorise requests; everything else is fetched fresh from the DB.
export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET); // throws on invalid/expired
}
