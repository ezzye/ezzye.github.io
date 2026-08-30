import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANARY_DATABASE_NAME,
  CANARY_WORKER_NAME,
  makeCloudflareCanaryConfig,
  REHEARSAL_DATABASE_ID,
  SITES_PLACEHOLDER_DATABASE_ID,
} from '../scripts/write-cloudflare-canary-config.mjs';

void test('makes a route-less, isolated timer canary by default', () => {
  const config = makeCloudflareCanaryConfig({ rehearsal: true });
  assert.equal(config.name, `${CANARY_WORKER_NAME}-rehearsal`);
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.equal('route' in config, false);
  assert.equal('routes' in config, false);
  assert.equal(config.assets.binding, 'ASSETS');
  assert.equal(config.assets.run_worker_first, true);
  assert.deepEqual(config.triggers.crons, ['*/15 * * * *']);
  assert.equal(config.vars.AUTH_GATE, 'cloudflare-access');
  assert.equal(config.secrets, undefined);
  assert.equal(config.d1_databases[0].database_id, REHEARSAL_DATABASE_ID);
  assert.equal(
    config.d1_databases[0].database_name,
    `${CANARY_DATABASE_NAME}-rehearsal`,
  );
});

void test('requires an explicit real D1 UUID outside rehearsal mode', () => {
  for (const databaseId of [
    undefined,
    'not-a-uuid',
    SITES_PLACEHOLDER_DATABASE_ID,
    REHEARSAL_DATABASE_ID,
  ]) {
    assert.throws(
      () => makeCloudflareCanaryConfig({ databaseId }),
      /separate canary D1 UUID/,
    );
  }

  const realDatabaseId = '12345678-1234-4234-9234-123456789abc';
  const config = makeCloudflareCanaryConfig({
    databaseId: realDatabaseId,
  });
  assert.equal(config.name, CANARY_WORKER_NAME);
  assert.equal(config.d1_databases[0].database_id, realDatabaseId);
});

void test('enables the owner route only when it is explicitly requested', () => {
  const config = makeCloudflareCanaryConfig({
    ownerRoute: true,
    rehearsal: true,
  });
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, false);
  assert.equal('route' in config, false);
  assert.equal('routes' in config, false);
  assert.ok(config.secrets);
  assert.deepEqual(config.secrets.required, [
    'ADMIN_EMAIL',
    'CF_ACCESS_TEAM_DOMAIN',
    'CF_ACCESS_AUD',
  ]);
});
