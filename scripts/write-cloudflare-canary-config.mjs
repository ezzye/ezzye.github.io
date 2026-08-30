import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CANARY_WORKER_NAME = 'coding-for-justice-private-canary';
export const CANARY_DATABASE_NAME = 'coding-for-justice-private-canary';
export const CANARY_CONFIG_PATH = '.wrangler/cloudflare-canary/wrangler.json';
export const REHEARSAL_DATABASE_ID = '11111111-1111-4111-8111-111111111111';
export const SITES_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const allowedArguments = new Set(['--owner-route', '--rehearsal']);

/**
 * @param {{ databaseId?: string, ownerRoute?: boolean, rehearsal?: boolean }} [options]
 */
export function makeCloudflareCanaryConfig({
  databaseId,
  ownerRoute = false,
  rehearsal = false,
} = {}) {
  const resolvedDatabaseId = rehearsal
    ? REHEARSAL_DATABASE_ID
    : requireRealDatabaseId(databaseId);

  const config = {
    $schema: '../../node_modules/wrangler/config-schema.json',
    name: rehearsal ? `${CANARY_WORKER_NAME}-rehearsal` : CANARY_WORKER_NAME,
    main: '../../worker/index.ts',
    compatibility_date: '2026-08-28',
    compatibility_flags: ['nodejs_compat'],
    workers_dev: ownerRoute,
    preview_urls: false,
    assets: {
      binding: 'ASSETS',
      run_worker_first: true,
    },
    d1_databases: [
      {
        binding: 'DB',
        database_name: rehearsal
          ? `${CANARY_DATABASE_NAME}-rehearsal`
          : CANARY_DATABASE_NAME,
        database_id: resolvedDatabaseId,
        migrations_dir: '../../drizzle',
      },
    ],
    triggers: { crons: ['*/15 * * * *'] },
    observability: {
      enabled: true,
      head_sampling_rate: 1,
      logs: {
        enabled: true,
        head_sampling_rate: 1,
        invocation_logs: true,
        persist: true,
      },
    },
    vars: {
      AUTH_GATE: 'cloudflare-access',
    },
    secrets: ownerRoute
      ? {
          required: ['ADMIN_EMAIL', 'CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD'],
        }
      : undefined,
  };
  return config;
}

/**
 * @param {{
 *   databaseId?: string,
 *   ownerRoute?: boolean,
 *   rehearsal?: boolean,
 *   outputPath?: string,
 * }} [options]
 */
export async function writeCloudflareCanaryConfig({
  databaseId,
  ownerRoute = false,
  rehearsal = false,
  outputPath = resolve(projectRoot, CANARY_CONFIG_PATH),
} = {}) {
  const config = makeCloudflareCanaryConfig({
    databaseId,
    ownerRoute,
    rehearsal,
  });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o600,
  });
  return { config, outputPath };
}

function requireRealDatabaseId(value) {
  const databaseId = value?.trim();
  if (
    !databaseId ||
    databaseId === SITES_PLACEHOLDER_DATABASE_ID ||
    databaseId === REHEARSAL_DATABASE_ID ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      databaseId,
    )
  ) {
    throw new Error(
      'Set CFJ_CLOUDFLARE_CANARY_DATABASE_ID to the separate canary D1 UUID.',
    );
  }
  return databaseId.toLowerCase();
}

async function main() {
  const argumentsSet = new Set(process.argv.slice(2));
  for (const argument of argumentsSet) {
    if (!allowedArguments.has(argument)) {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  const rehearsal = argumentsSet.has('--rehearsal');
  const ownerRoute = argumentsSet.has('--owner-route');
  const { outputPath } = await writeCloudflareCanaryConfig({
    databaseId: process.env.CFJ_CLOUDFLARE_CANARY_DATABASE_ID,
    ownerRoute,
    rehearsal,
  });
  const routeState = ownerRoute ? 'owner route requested' : 'timer only';
  process.stdout.write(
    `Wrote ${rehearsal ? 'rehearsal' : 'private'} canary config (${routeState}) to ${outputPath}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
