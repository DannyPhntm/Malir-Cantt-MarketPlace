// Safe postinstall hook: generate the Prisma Client when possible, but never
// fail the install. This keeps `npm install` smooth for new local environments
// while staying compatible with production installs that omit dev dependencies
// (e.g. `npm ci --omit=dev`, where the `prisma` CLI is absent) — in that case we
// skip gracefully and the client is expected to be generated during the build.
//
// Opt out with SKIP_PRISMA_GENERATE=1 (useful in CI steps that generate later).

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = dirname(dirname(fileURLToPath(import.meta.url)));
const log = (msg) => console.log(`[postinstall] ${msg}`);

function run() {
  if (process.env.SKIP_PRISMA_GENERATE === '1') {
    log('SKIP_PRISMA_GENERATE=1 set — skipping prisma generate.');
    return;
  }

  // Schema must exist (skip in weird partial checkouts).
  if (!existsSync(join(serverDir, 'prisma', 'schema.prisma'))) {
    log('No prisma/schema.prisma found — skipping.');
    return;
  }

  // The `prisma` CLI is a devDependency; in production installs without dev
  // deps it won't be present. Skip rather than error.
  if (!existsSync(join(serverDir, 'node_modules', 'prisma'))) {
    log('Prisma CLI not installed (prod install?) — skipping generate. Run it during your build.');
    return;
  }

  // Resolve the local binary explicitly so this works both as an npm lifecycle
  // script (where node_modules/.bin is on PATH) and when invoked directly.
  const binName = process.platform === 'win32' ? 'prisma.cmd' : 'prisma';
  const localBin = join(serverDir, 'node_modules', '.bin', binName);
  const prismaCmd = existsSync(localBin) ? JSON.stringify(localBin) : 'prisma';

  try {
    log('Generating Prisma Client…');
    execSync(`${prismaCmd} generate`, { cwd: serverDir, stdio: 'inherit' });
  } catch (err) {
    // Never break the install — surface a warning the user can act on.
    log(`prisma generate failed (continuing): ${err.message}`);
    log('Run `npm run generate` manually once dependencies are in place.');
  }
}

run();
