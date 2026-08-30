import assert from 'node:assert/strict';
import test from 'node:test';

import {
  currentUpdateDraft,
  repairCanPublish,
  repairDraftNextStep,
  slugFromTitle,
} from '../lib/admin-content.ts';
import type {
  ActionCard,
  AdminRepair,
  AdminRepairUpdate,
} from '../lib/types.ts';

function completeRepair(overrides: Partial<AdminRepair> = {}): AdminRepair {
  return {
    id: 'repair_1',
    slug: 'fair-test',
    title: 'Make this process fairer',
    summary: 'A clear account of the barrier and why it matters to people.',
    stage: 'framing',
    scope: 'One named service and one repeatable barrier.',
    affectedGroups: 'People shut out by the current process.',
    knownFacts: 'The public guidance contains the stated rule.',
    unknowns: 'We do not yet know how often the barrier occurs.',
    disputedClaims: 'None found.',
    desiredChange:
      'People can complete the process without the repeatable barrier.',
    smallestTest: 'Five people try one revised step and record what happened.',
    safeguards:
      'Ask for no private case files and stop if anyone feels pushed.',
    ownerName: 'Repair owner',
    partnerName: 'Affected-group checker',
    reviewDate: '2099-12-31',
    updatedAt: '2026-08-30T12:00:00.000Z',
    isDemo: false,
    isPublished: false,
    publicationGuard: null,
    ...overrides,
  };
}

function completeAction(overrides: Partial<ActionCard> = {}): ActionCard {
  return {
    id: 'action_1',
    repairId: 'repair_1',
    title: 'Check the revised public step',
    intendedOutput:
      'A short list of what worked and what still blocked people.',
    whyItMatters: 'The repair is not real until affected people can use it.',
    timeSize: '30 minutes',
    compensation: 'Paid at the agreed partner rate.',
    participationMode: 'offer',
    responseQuestions: [],
    responsePath: null,
    isPreview: false,
    skillsNeeded: 'Careful reading',
    locationMode: 'At home',
    ownerName: 'Repair owner',
    reviewerName: 'Affected-group checker',
    pilotTermsApprovedAt: null,
    pilotApprovalSnapshot: null,
    capacity: 2,
    status: 'stopped',
    evidenceRequired: 'A checked list with no names or private case facts.',
    reviewDate: '2099-12-31',
    stopCondition: 'Stop after two checks or at the review date.',
    sortOrder: 1,
    ...overrides,
  };
}

void test('makes short stable URL words from a working title', () => {
  assert.equal(
    slugFromTitle('  Café access: what now?  '),
    'cafe-access-what-now',
  );
  assert.equal(slugFromTitle('***'), 'repair');
});

void test('shows exactly one next repair-draft step', () => {
  assert.equal(
    repairDraftNextStep(completeRepair({ scope: '' }), []),
    'problem',
  );
  assert.equal(
    repairDraftNextStep(completeRepair({ desiredChange: '' }), []),
    'change',
  );
  assert.equal(
    repairDraftNextStep(completeRepair({ partnerName: null }), []),
    'guard',
  );
  assert.equal(repairDraftNextStep(completeRepair(), []), 'start-action');
  assert.equal(
    repairDraftNextStep(completeRepair(), [completeAction({ title: '' })]),
    'action-basics',
  );
  assert.equal(
    repairDraftNextStep(completeRepair(), [
      completeAction({ evidenceRequired: '' }),
    ]),
    'action-guard',
  );
  assert.equal(
    repairDraftNextStep(completeRepair(), [completeAction()]),
    'publish',
  );
});

void test('publish gate needs the complete private frame and first job', () => {
  assert.equal(repairCanPublish(completeRepair(), [completeAction()]), true);
  assert.equal(
    repairCanPublish(completeRepair({ safeguards: '' }), [completeAction()]),
    false,
  );
  assert.equal(repairCanPublish(completeRepair(), []), false);
  assert.equal(
    repairCanPublish(completeRepair(), [
      completeAction({ status: 'verified' }),
    ]),
    false,
  );
  assert.equal(
    repairCanPublish(completeRepair(), [
      completeAction({ repairId: 'another_repair' }),
    ]),
    false,
  );
  assert.equal(
    repairCanPublish(completeRepair(), [
      completeAction({ participationMode: 'direct_response' }),
    ]),
    false,
  );
  assert.equal(
    repairCanPublish(completeRepair(), [completeAction(), completeAction()]),
    false,
  );
});

void test('published repairs do not re-enter the draft workflow', () => {
  assert.equal(
    repairDraftNextStep(completeRepair({ isPublished: true }), [
      completeAction(),
    ]),
    null,
  );
});

void test('finds only the private weekly update', () => {
  const base = {
    repairId: 'repair_1',
    title: 'Week one',
    body: 'This week the first small job was completed and checked.',
    evidenceChanged: 'Two people confirmed the revised step was clearer.',
    remainsUnfair: 'The older paper route still uses unclear words.',
    nextOwner: 'Repair owner',
    nextReviewDate: '2099-12-31',
    publishedAt: '2026-08-30T12:00:00.000Z',
  };
  const updates: AdminRepairUpdate[] = [
    { ...base, id: 'public', isPublished: true, publicationGuard: null },
    { ...base, id: 'draft', isPublished: false, publicationGuard: null },
  ];
  assert.equal(currentUpdateDraft(updates)?.id, 'draft');
});
