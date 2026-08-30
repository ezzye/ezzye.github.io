import assert from 'node:assert/strict';
import test from 'node:test';

import {
  actionInviteTokenLooksValid,
  createActionInviteToken,
  hashActionInviteToken,
} from '../lib/action-invites.ts';

void test('creates opaque invite tokens with the expected shape', () => {
  const tokens = new Set(
    Array.from({ length: 200 }, () => createActionInviteToken()),
  );

  assert.equal(tokens.size, 200);
  for (const token of tokens) {
    assert.equal(actionInviteTokenLooksValid(token), true);
    assert.equal(token.length, 48);
  }
});

void test('rejects missing, shortened and non-hex invite values', () => {
  assert.equal(actionInviteTokenLooksValid(''), false);
  assert.equal(actionInviteTokenLooksValid('a'.repeat(47)), false);
  assert.equal(actionInviteTokenLooksValid('g'.repeat(48)), false);
  assert.equal(actionInviteTokenLooksValid('A'.repeat(48)), false);
});

void test('stores a stable hash rather than the readable token', async () => {
  const token = createActionInviteToken();
  const first = await hashActionInviteToken(token);
  const second = await hashActionInviteToken(token);

  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, token);
});
