import assert from 'node:assert/strict';
import test from 'node:test';

import { demoBundle } from '../lib/demo-data.ts';
import {
  outcomeDraftPublicationSnapshot,
  outcomePublishedSnapshot,
  publicationSnapshotHash,
  repairPublicationSnapshot,
  repairUpdatePublicationSnapshot,
} from '../lib/publication-snapshot.ts';
import type {
  ActionCard,
  AdminOutcome,
  Repair,
  RepairUpdate,
} from '../lib/types.ts';

function changed(value: unknown): unknown {
  if (typeof value === 'string') return `${value} changed`;
  if (typeof value === 'number') return value + 1;
  if (typeof value === 'boolean') return !value;
  if (Array.isArray(value)) return [...value, 'one more item'];
  if (value === null) return 'now present';
  throw new Error('Unsupported test value.');
}

void test('repair snapshot covers every public repair and job field', async () => {
  const repair = structuredClone(demoBundle.repair);
  const action = structuredClone(demoBundle.actions[0]!);
  const original = await publicationSnapshotHash(
    repairPublicationSnapshot(repair, action),
  );
  const repairKeys: Array<keyof Repair> = [
    'id',
    'slug',
    'title',
    'summary',
    'scope',
    'affectedGroups',
    'knownFacts',
    'unknowns',
    'disputedClaims',
    'desiredChange',
    'smallestTest',
    'safeguards',
    'ownerName',
    'partnerName',
    'reviewDate',
    'isDemo',
  ];
  for (const key of repairKeys) {
    const edited = structuredClone(repair) as Record<string, unknown>;
    edited[key] = changed(edited[key]);
    assert.notEqual(
      await publicationSnapshotHash(
        repairPublicationSnapshot(edited as Repair, action),
      ),
      original,
      `repair field ${key} must change the snapshot`,
    );
  }

  const actionKeys: Array<keyof ActionCard> = [
    'id',
    'repairId',
    'title',
    'intendedOutput',
    'whyItMatters',
    'timeSize',
    'compensation',
    'participationMode',
    'responseQuestions',
    'responsePath',
    'isPreview',
    'skillsNeeded',
    'locationMode',
    'ownerName',
    'reviewerName',
    'capacity',
    'status',
    'evidenceRequired',
    'reviewDate',
    'stopCondition',
    'sortOrder',
  ];
  for (const key of actionKeys) {
    const edited = structuredClone(action) as Record<string, unknown>;
    edited[key] = changed(edited[key]);
    assert.notEqual(
      await publicationSnapshotHash(
        repairPublicationSnapshot(repair, edited as ActionCard),
      ),
      original,
      `job field ${key} must change the snapshot`,
    );
  }

  const bookkeepingEdit = {
    ...repair,
    updatedAt: '2099-01-01T00:00:00.000Z',
    stage: 'stopped' as const,
  };
  const actionBookkeepingEdit = {
    ...action,
    pilotTermsApprovedAt: '2099-01-01T00:00:00.000Z',
    pilotApprovalSnapshot: 'private approval record',
  };
  assert.equal(
    await publicationSnapshotHash(
      repairPublicationSnapshot(bookkeepingEdit, actionBookkeepingEdit),
    ),
    original,
  );
});

void test('weekly update snapshot covers every authored public word', async () => {
  const update = structuredClone(demoBundle.updates[0]!);
  const original = await publicationSnapshotHash(
    repairUpdatePublicationSnapshot(update),
  );
  const keys: Array<keyof RepairUpdate> = [
    'id',
    'repairId',
    'title',
    'body',
    'evidenceChanged',
    'remainsUnfair',
    'nextOwner',
    'nextReviewDate',
  ];
  for (const key of keys) {
    const edited = structuredClone(update) as Record<string, unknown>;
    edited[key] = changed(edited[key]);
    assert.notEqual(
      await publicationSnapshotHash(
        repairUpdatePublicationSnapshot(edited as RepairUpdate),
      ),
      original,
      `update field ${key} must change the snapshot`,
    );
  }
  assert.equal(
    await publicationSnapshotHash(
      repairUpdatePublicationSnapshot({
        ...update,
        publishedAt: '2099-01-01T00:00:00.000Z',
      }),
    ),
    original,
  );
});

void test('outcome review is order-stable and never contains reply text', async () => {
  const outcome: AdminOutcome = {
    id: 'outcome_test',
    repairId: 'repair_test',
    title: 'A checked result',
    activity: 'We ran one small and bounded public test.',
    observedEffect: 'Three people found the public step more clearly.',
    evidence: 'A public method note describes the bounded check.',
    evidenceUrl: 'https://example.org/proof',
    confidence: 'observed',
    verifierName: 'Independent checker',
    whoBenefited: 'People trying the test page.',
    whatDidNotChange: 'The wider service did not change.',
    learning: 'Run a larger check before making a wider claim.',
    publishedAt: null,
    sortOrder: 999,
    isPublished: false,
    sourceMode: 'consented_replies',
    sourceReplyCount: 0,
    selectedResponseIds: ['response_b', 'response_a'],
    publicationGuard: null,
    reviewedGuard: null,
    consentCheckedAt: null,
  };
  const first = outcomeDraftPublicationSnapshot(outcome, [
    'response_b',
    'response_a',
  ]);
  const second = outcomeDraftPublicationSnapshot(outcome, [
    'response_a',
    'response_b',
  ]);
  assert.equal(
    await publicationSnapshotHash(first),
    await publicationSnapshotHash(second),
  );
  const stored = JSON.stringify({
    review: first,
    published: outcomePublishedSnapshot(outcome, 2),
  });
  assert.doesNotMatch(stored, /private answer|questions|answers/i);
  assert.doesNotMatch(
    JSON.stringify(outcomePublishedSnapshot(outcome, 2)),
    /response_a|response_b/,
  );
});
