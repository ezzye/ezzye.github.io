import assert from 'node:assert/strict';
import test from 'node:test';

import { sendRetentionHeartbeat } from '../operations/retention-timer/src/index.ts';

const secret = 'c'.repeat(64);

void test('the route-less timer calls only the approved HTTPS endpoint', async () => {
  const captured: Array<{ input: string; init?: RequestInit }> = [];
  await sendRetentionHeartbeat(
    {
      RETENTION_ENDPOINT_URL:
        'https://codingforjustice.org.uk/api/internal/retention',
      RETENTION_CRON_SECRET: secret,
    },
    async (input, init) => {
      const inputUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      captured.push({ input: inputUrl, init });
      return new Response('{"ok":true}', { status: 200 });
    },
  );
  const call = captured[0];
  assert.ok(call);
  assert.equal(
    call.input,
    'https://codingforjustice.org.uk/api/internal/retention',
  );
  assert.equal(call.init?.method, 'POST');
  assert.equal(
    new Headers(call.init?.headers).get('authorization'),
    `Bearer ${secret}`,
  );
});

void test('the timer normalizes the same URL-safe secret the Site accepts', async () => {
  let authorization = '';
  await sendRetentionHeartbeat(
    {
      RETENTION_ENDPOINT_URL:
        'https://codingforjustice.org.uk/api/internal/retention',
      RETENTION_CRON_SECRET: `  ${secret}  `,
    },
    async (_input, init) => {
      authorization = new Headers(init?.headers).get('authorization') ?? '';
      return new Response(null, { status: 200 });
    },
  );
  assert.equal(authorization, `Bearer ${secret}`);

  await assert.rejects(
    sendRetentionHeartbeat(
      {
        RETENTION_ENDPOINT_URL:
          'https://codingforjustice.org.uk/api/internal/retention',
        RETENTION_CRON_SECRET: `${'c'.repeat(61)}+/=`,
      },
      async () => new Response(null, { status: 200 }),
    ),
    /not valid/,
  );
});

void test('the timer fails closed for another host or a failed Site response', async () => {
  await assert.rejects(
    sendRetentionHeartbeat(
      {
        RETENTION_ENDPOINT_URL: 'https://example.com/api/internal/retention',
        RETENTION_CRON_SECRET: secret,
      },
      async () => new Response(null, { status: 200 }),
    ),
    /approved HTTPS route/,
  );
  await assert.rejects(
    sendRetentionHeartbeat(
      {
        RETENTION_ENDPOINT_URL:
          'https://codingforjustice.org.uk/api/internal/retention',
        RETENTION_CRON_SECRET: secret,
      },
      async () => new Response(null, { status: 503 }),
    ),
    /returned 503/,
  );
});
