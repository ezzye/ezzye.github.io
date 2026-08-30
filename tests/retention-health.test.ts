import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RETENTION_HEARTBEAT_MAX_AGE_MS,
  retentionHeartbeatIsRecent,
  retentionHeartbeatState,
} from '../lib/retention-health.ts';
import type { AdminRetentionSweep } from '../lib/types.ts';

const now = new Date('2026-08-30T12:00:00.000Z');

function sweep(
  completed: string | null,
  error: string | null = null,
): AdminRetentionSweep {
  return {
    lastStartedAt: completed,
    lastCompletedAt: completed,
    lastRecordsDeleted: 0,
    runCount: 1,
    lastErrorAt: error,
  };
}

void test('retention heartbeat fails closed when missing', () => {
  assert.equal(retentionHeartbeatState(null, now), 'missing');
  assert.equal(retentionHeartbeatIsRecent(null, now), false);
});

void test('retention heartbeat accepts a success no more than 45 minutes old', () => {
  const atBoundary = new Date(
    now.getTime() - RETENTION_HEARTBEAT_MAX_AGE_MS,
  ).toISOString();
  assert.equal(retentionHeartbeatState(sweep(atBoundary), now), 'recent');
  assert.equal(
    retentionHeartbeatState(
      sweep(new Date(Date.parse(atBoundary) - 1).toISOString()),
      now,
    ),
    'stale',
  );
});

void test('a later error overrides an older success until recovery', () => {
  assert.equal(
    retentionHeartbeatState(
      sweep('2026-08-30T11:55:00.000Z', '2026-08-30T11:56:00.000Z'),
      now,
    ),
    'failed',
  );
  assert.equal(
    retentionHeartbeatState(
      sweep('2026-08-30T11:57:00.000Z', '2026-08-30T11:56:00.000Z'),
      now,
    ),
    'recent',
  );
  assert.equal(
    retentionHeartbeatState(sweep(null, '2026-08-30T11:56:00.000Z'), now),
    'failed',
  );
});

void test('malformed and future heartbeat times are invalid', () => {
  assert.equal(retentionHeartbeatState(sweep('not-a-time'), now), 'invalid');
  assert.equal(
    retentionHeartbeatState(sweep('2026-08-30T12:00:00.001Z'), now),
    'invalid',
  );
  assert.equal(
    retentionHeartbeatState(
      sweep('2026-08-30T11:59:00.000Z', 'not-a-time'),
      now,
    ),
    'invalid',
  );
});
