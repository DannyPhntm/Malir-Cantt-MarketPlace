import 'dotenv/config';
import { createApp } from './app.js';
import prisma from './lib/prisma.js';

const PORT = process.env.PORT || 4000;
// Bind all interfaces so the platform (Railway) can route external traffic to
// the container — binding localhost only would make the public URL time out.
const HOST = '0.0.0.0';
const app = createApp();

const server = app.listen(PORT, HOST, () => {
  console.log(`People of Malir Cantt Bazaar API listening on ${HOST}:${PORT} (path /api)`);
});

// Graceful shutdown — close the HTTP server and Prisma connection.
async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
