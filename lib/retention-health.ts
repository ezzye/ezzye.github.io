import type { AdminRetentionSweep } from '@/lib/types';

export const RETENTION_HEARTBEAT_MAX_AGE_MS = 45 * 60 * 1_000;

export type RetentionHeartbeatState =
  | 'recent'
  | 'missing'
  | 'stale'
  | 'failed'
  | 'invalid';

function parsedTime(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function retentionHeartbeatState(
  sweep: AdminRetentionSweep | null,
  now = new Date(),
): RetentionHeartbeatState {
  if (!sweep) return 'missing';
  const completed = parsedTime(sweep.lastCompletedAt);
  const error = parsedTime(sweep.lastErrorAt);
  if (Number.isNaN(completed) || Number.isNaN(error)) return 'invalid';
  if (error !== null && (completed === null || error >= completed)) {
    return 'failed';
  }
  if (completed === null) return 'missing';
  const age = now.getTime() - completed;
  if (!Number.isFinite(age) || age < 0) return 'invalid';
  if (age > RETENTION_HEARTBEAT_MAX_AGE_MS) return 'stale';
  return 'recent';
}

export function retentionHeartbeatIsRecent(
  sweep: AdminRetentionSweep | null,
  now = new Date(),
): boolean {
  return retentionHeartbeatState(sweep, now) === 'recent';
}
