import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CANARY_CONFIG_PATH,
  CANARY_WORKER_NAME,
  REHEARSAL_DATABASE_ID,
  SITES_PLACEHOLDER_DATABASE_ID,
} from './write-cloudflare-canary-config.mjs';

const allowedArguments = new Set(['--owner-route', '--real']);
const argumentsSet = new Set(process.argv.slice(2));
for (const argument of argumentsSet) {
  assert.ok(allowedArguments.has(argument), `Unknown argument: ${argument}`);
}
const ownerRoute = argumentsSet.has('--owner-route');
const realPackage = ownerRoute || argumentsSet.has('--real');

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceConfigPath = resolve(projectRoot, CANARY_CONFIG_PATH);
const builtConfigPath = resolve(projectRoot, 'dist/server/wrangler.json');
const deployRedirectPath = resolve(projectRoot, '.wrangler/deploy/config.json');

const [sourceConfig, builtConfig, deployRedirect] = await Promise.all([
  readJson(sourceConfigPath),
  readJson(builtConfigPath),
  readJson(deployRedirectPath),
]);

assert.equal(
  sourceConfig.name,
  realPackage ? CANARY_WORKER_NAME : `${CANARY_WORKER_NAME}-rehearsal`,
);
assert.equal(sourceConfig.workers_dev, ownerRoute);
assert.equal(sourceConfig.preview_urls, false);
assert.equal(sourceConfig.route, undefined);
assert.equal(sourceConfig.routes, undefined);
assert.equal(sourceConfig.vars?.AUTH_GATE, 'cloudflare-access');
assert.deepEqual(sourceConfig.triggers?.crons, ['*/15 * * * *']);
assert.deepEqual(
  sourceConfig.secrets?.required,
  ownerRoute
    ? ['ADMIN_EMAIL', 'CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD']
    : undefined,
);
assert.equal(sourceConfig.assets?.binding, 'ASSETS');
assert.equal(sourceConfig.assets?.run_worker_first, true);
assert.equal(sourceConfig.assets?.directory, undefined);
assert.equal(sourceConfig.r2_buckets, undefined);
assert.deepEqual(sourceConfig.observability, {
  enabled: true,
  head_sampling_rate: 1,
  logs: {
    enabled: true,
    head_sampling_rate: 1,
    invocation_logs: true,
    persist: true,
  },
});

const sourceDatabase = onlyDatabase(sourceConfig);
if (realPackage) {
  assert.match(
    sourceDatabase.database_id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  );
  assert.notEqual(sourceDatabase.database_id, REHEARSAL_DATABASE_ID);
} else {
  assert.equal(sourceDatabase.database_id, REHEARSAL_DATABASE_ID);
}
assert.notEqual(sourceDatabase.database_id, SITES_PLACEHOLDER_DATABASE_ID);
assert.notEqual(sourceDatabase.database_name, 'site-creator-d1');
assert.equal(
  resolve(dirname(sourceConfigPath), sourceDatabase.migrations_dir),
  resolve(projectRoot, 'drizzle'),
);

assert.equal(builtConfig.name, sourceConfig.name);
assert.equal(builtConfig.main, 'index.js');
assert.equal(builtConfig.workers_dev, ownerRoute);
assert.equal(builtConfig.preview_urls, false);
assert.equal(builtConfig.route, undefined);
assert.equal(builtConfig.routes, undefined);
assert.equal(builtConfig.vars?.AUTH_GATE, 'cloudflare-access');
assert.deepEqual(builtConfig.triggers?.crons, ['*/15 * * * *']);
assert.equal(builtConfig.assets?.binding, 'ASSETS');
assert.equal(builtConfig.assets?.run_worker_first, true);
assert.deepEqual(builtConfig.r2_buckets ?? [], []);
assert.equal(builtConfig.observability?.enabled, true);
assert.equal(builtConfig.observability?.head_sampling_rate, 1);
assert.equal(builtConfig.observability?.logs?.invocation_logs, true);

const builtDatabase = onlyDatabase(builtConfig);
assert.equal(builtDatabase.database_id, sourceDatabase.database_id);
assert.notEqual(builtDatabase.database_name, 'site-creator-d1');
assert.equal(
  resolve(dirname(builtConfigPath), builtDatabase.migrations_dir),
  resolve(projectRoot, 'drizzle'),
);

for (const key of Object.keys(builtConfig.vars ?? {})) {
  assert.doesNotMatch(key, /^(PUBLIC_|PILOT_|DEEPSEEK_)/);
}

assert.equal(
  resolve(dirname(deployRedirectPath), deployRedirect.configPath),
  builtConfigPath,
);
assert.deepEqual(deployRedirect.auxiliaryWorkers, []);

process.stdout.write(
  `${JSON.stringify({ ok: true, checks: 31, worker: builtConfig.name })}\n`,
);

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function onlyDatabase(config) {
  assert.equal(config.d1_databases?.length, 1);
  const database = config.d1_databases[0];
  assert.equal(database.binding, 'DB');
  return database;
}
