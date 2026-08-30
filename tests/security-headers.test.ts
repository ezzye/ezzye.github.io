import assert from 'node:assert/strict';
import test from 'node:test';

import nextConfig from '../next.config.ts';

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
        condition.key === 'coding-for-justice.ezzye.chatgpt.site',
    ),
  );
  assert.deepEqual(noindexRule?.headers, [
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  ]);
});
