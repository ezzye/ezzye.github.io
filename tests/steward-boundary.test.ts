import assert from 'node:assert/strict';
import test from 'node:test';

import { publicStewardInput } from '../lib/steward.ts';
import type { RepairBundle } from '../lib/types.ts';

const INTERNAL_SENTINEL = 'NEVER_SEND_INTERNAL_PILOT_CONTROL';

function fixture(): RepairBundle {
  return {
    repair: {
      id: 'CFJ-R002',
      slug: 'plain-home-page-check',
      title: 'Can people tell what this site is for?',
      summary: 'A public summary.',
      stage: 'checking',
      scope: 'The public home page.',
      affectedGroups: 'First-time visitors.',
      knownFacts: 'The page is live privately.',
      unknowns: 'Whether a new visitor understands it.',
      disputedClaims: 'None.',
      desiredChange: 'A clear first screen.',
      smallestTest: 'Five short replies.',
      safeguards: 'No private case facts.',
      ownerName: 'Coding for Justice',
      partnerName: null,
      reviewDate: '2026-09-06',
      updatedAt: '2026-08-30T12:00:00.000Z',
      isDemo: false,
    },
    actions: [
      {
        id: 'CFJ-A004',
        repairId: 'CFJ-R002',
        title: 'Tell us if this home page makes sense',
        intendedOutput: 'Five short answers.',
        whyItMatters: 'People need to know what to do.',
        timeSize: '10 minutes',
        compensation: 'Unpaid rehearsal.',
        participationMode: 'direct_response',
        responseQuestions: ['What is this site?'],
        responsePath: '/tests/home-page',
        isPreview: true,
        skillsNeeded: 'No special skill.',
        locationMode: 'At home.',
        ownerName: 'Coding for Justice',
        reviewerName: 'Site owner',
        capacity: 5,
        status: 'ready',
        evidenceRequired: 'Five private replies.',
        reviewDate: '2026-09-06',
        stopCondition: 'Stop after five replies.',
        sortOrder: 1,
        pilotTermsApprovedAt: '2026-08-30T12:00:00.000Z',
        pilotApprovalSnapshot: JSON.stringify({
          approvalReference: INTERNAL_SENTINEL,
          recruitmentPlan: INTERNAL_SENTINEL,
          replyReader: INTERNAL_SENTINEL,
        }),
      },
    ],
    outcomes: [],
    updates: [],
  };
}

void test('DeepSeek input excludes every owner-only pilot control field', () => {
  const input = publicStewardInput(fixture());
  const serialized = JSON.stringify(input);

  assert.equal(serialized.includes(INTERNAL_SENTINEL), false);
  assert.equal('pilotTermsApprovedAt' in input.actions[0]!, false);
  assert.equal('pilotApprovalSnapshot' in input.actions[0]!, false);
  assert.deepEqual(Object.keys(input.actions[0]!).sort(), [
    'capacity',
    'compensation',
    'evidenceRequired',
    'id',
    'intendedOutput',
    'isPreview',
    'locationMode',
    'ownerName',
    'participationMode',
    'repairId',
    'responsePath',
    'responseQuestions',
    'reviewDate',
    'reviewerName',
    'skillsNeeded',
    'sortOrder',
    'status',
    'stopCondition',
    'timeSize',
    'title',
    'whyItMatters',
  ]);
});
