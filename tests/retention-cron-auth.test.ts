import assert from 'node:assert/strict';
import test from 'node:test';

import { retentionCronRequestIsAuthorized } from '../lib/retention-cron-auth.ts';

const secret = 'a'.repeat(64);

void test('the retention route fails closed without a strong exact bearer secret', async () => {
  assert.equal(await retentionCronRequestIsAuthorized(undefined, null), false);
  assert.equal(
    await retentionCronRequestIsAuthorized('short', 'Bearer short'),
    false,
  );
  assert.equal(
    await retentionCronRequestIsAuthorized(secret, `Bearer ${'b'.repeat(64)}`),
    false,
  );
  assert.equal(
    await retentionCronRequestIsAuthorized(secret, `Basic ${secret}`),
    false,
  );
});

void test('the retention route accepts only the exact configured bearer secret', async () => {
  assert.equal(
    await retentionCronRequestIsAuthorized(secret, `Bearer ${secret}`),
    true,
  );
});
