import assert from 'node:assert/strict';
import test from 'node:test';

import nextConfig from '../next.config.ts';
import {
  generatedSiteResponse,
  SITES_GENERATED_HOST,
} from '../lib/site-origin.ts';

void test('does not force broken mail and rollback subdomains onto HTTPS', async () => {
  assert.equal(typeof nextConfig.headers, 'function');
  const rules = await nextConfig.headers!();
  const hstsValues = rules.flatMap((rule) =>
    rule.headers
      .filter((header) => header.key === 'Strict-Transport-Security')
      .map((header) => header.value),
  );

  assert.deepEqual(hstsValues, ['max-age=300', 'max-age=300']);
  assert.equal(
    hstsValues.some((value) => value.includes('includeSubDomains')),
    false,
  );

  const noindexRule = rules.find((rule) =>
    rule.has?.some(
      (condition) =>
        condition.type === 'host' &&
        condition.value === 'coding-for-justice.ezzye.chatgpt.site',
    ),
  );
  assert.deepEqual(noindexRule?.headers, [
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  ]);
});

void test('marks only the generated Sites address as noindex at the Worker boundary', async () => {
  const generated = generatedSiteResponse(
    new Request(`https://${SITES_GENERATED_HOST}/repairs`),
    new Response('private preview', {
      headers: { 'Cache-Control': 'no-store' },
    }),
  );
  assert.equal(
    generated.headers.get('x-robots-tag'),
    'noindex, nofollow',
  );
  assert.equal(generated.headers.get('cache-control'), 'no-store');
  assert.equal(await generated.text(), 'private preview');

  const publicResponse = new Response('public site');
  assert.equal(
    generatedSiteResponse(
      new Request('https://codingforjustice.org.uk/repairs'),
      publicResponse,
    ),
    publicResponse,
  );
  assert.equal(publicResponse.headers.get('x-robots-tag'), null);
});
