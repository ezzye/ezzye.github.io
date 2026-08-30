import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalPublicRedirect,
  PUBLIC_HOST,
  PUBLIC_ORIGIN,
  SITES_GENERATED_HOST,
  WWW_PUBLIC_HOST,
} from '../lib/site-origin.ts';

void test('uses the apex as the one public address', async () => {
  assert.equal(PUBLIC_HOST, 'codingforjustice.org.uk');
  assert.equal(PUBLIC_ORIGIN, 'https://codingforjustice.org.uk');
  assert.equal(SITES_GENERATED_HOST, 'coding-for-justice.ezzye.chatgpt.site');
  assert.equal(WWW_PUBLIC_HOST, 'www.codingforjustice.org.uk');

  const redirect = canonicalPublicRedirect(
    'http://local.test/privacy?cutover_check=1',
    'www.codingforjustice.org.uk',
  );
  assert.equal(
    redirect?.toString(),
    'https://codingforjustice.org.uk/privacy?cutover_check=1',
  );
  assert.equal(
    canonicalPublicRedirect(
      'https://codingforjustice.org.uk/privacy',
      'codingforjustice.org.uk',
    ),
    null,
  );
});
