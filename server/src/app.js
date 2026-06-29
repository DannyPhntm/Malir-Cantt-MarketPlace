import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes/index.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Allowed browser origins for CORS. CLIENT_ORIGIN is a comma-separated list
// (e.g. "https://malircanttbazaar.com,https://www.malircanttbazaar.com").
// Defaults to the local Vite dev server. Origins are normalised so trailing
// slashes / casing don't cause spurious rejections.
const normOrigin = (o) => (o || '').trim().replace(/\/+$/, '').toLowerCase();
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(normOrigin)
  .filter(Boolean);

// Express app, exported separately from the listener so it can be imported by
// tests or a serverless adapter without binding a port.
export function createApp() {
  const app = express();

  // Behind Railway's proxy the real client IP is in X-Forwarded-For. Trust the
  // first hop so req.ip (and therefore per-IP rate limiting / brute-force
  // protection) keys on the actual client, not the shared proxy address.
  // `1` (not `true`) is the safe, specific value express-rate-limit recommends.
  app.set('trust proxy', 1);

  // Security headers (defaults). API serves JSON only, so allow cross-origin
  // resource sharing of those responses to the configured frontend.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS: allow only the configured origin(s). Requests with no Origin header
  // (curl, server-to-server, health checks) are permitted.
  app.use(
    cors({
      origin: (origin, cb) => {
        // No Origin header (curl, server-to-server, same-origin) → allow.
        if (!origin) return cb(null, true);
        if (ALLOWED_ORIGINS.includes(normOrigin(origin))) return cb(null, true);
        // Disallowed origin: deny CORS WITHOUT throwing — the browser blocks the
        // request via the missing Access-Control-Allow-Origin header, and we avoid
        // turning every cross-origin call into a 500.
        return cb(null, false);
      },
    }),
  );

  app.use(express.json({ limit: '15mb' })); // headroom for base64 image payloads

  // Generous global rate limit on the whole API (per IP).
  app.use('/api', globalLimiter);

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
