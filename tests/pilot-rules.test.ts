import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isStrictIsoDate,
  isValidPublicEmail,
  pilotApprovalSnapshotIsCurrent,
  pilotClosingDateIsAllowed,
  pilotClosingInstant,
} from '../lib/pilot-rules.ts';

void test('accepts only a real public email shape', () => {
  for (const value of ['', '   ', 'x', 'a@b', 'a b@example.org']) {
    assert.equal(isValidPublicEmail(value), false, value);
  }
  assert.equal(isValidPublicEmail('hello@example.org'), true);
});

void test('rejects impossible calendar dates', () => {
  for (const value of ['2026-02-29', '2026-02-31', '2026-04-31']) {
    assert.equal(isStrictIsoDate(value), false, value);
  }
  assert.equal(isStrictIsoDate('2028-02-29'), true);
});

void test('allows closing dates from 7 through 90 London calendar days', () => {
  const now = new Date('2026-08-30T12:00:00.000Z');
  assert.equal(pilotClosingDateIsAllowed('2026-09-05', now), false);
  assert.equal(pilotClosingDateIsAllowed('2026-09-06', now), true);
  assert.equal(pilotClosingDateIsAllowed('2026-11-28', now), true);
  assert.equal(pilotClosingDateIsAllowed('2026-11-29', now), false);
});

void test('closes at London midnight after the stated date', () => {
  assert.equal(pilotClosingInstant('2026-09-06'), '2026-09-06T23:00:00.000Z');
  assert.equal(pilotClosingInstant('2026-12-10'), '2026-12-11T00:00:00.000Z');
  assert.equal(pilotClosingInstant('2026-02-31'), null);
});

void test('invalidates approval when the current snapshot changes', () => {
  const approved = JSON.stringify({ version: 1, compensation: 'Unpaid' });
  const changed = JSON.stringify({ version: 1, compensation: 'Paid' });

  assert.equal(
    pilotApprovalSnapshotIsCurrent(
      '2026-08-30T12:00:00.000Z',
      approved,
      approved,
    ),
    true,
  );
  assert.equal(
    pilotApprovalSnapshotIsCurrent(
      '2026-08-30T12:00:00.000Z',
      approved,
      changed,
    ),
    false,
  );
  assert.equal(pilotApprovalSnapshotIsCurrent(null, approved, approved), false);
  assert.equal(
    pilotApprovalSnapshotIsCurrent('2026-08-30T12:00:00.000Z', null, approved),
    false,
  );
});
