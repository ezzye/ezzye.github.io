import assert from 'node:assert/strict';

const baseUrl = process.env.CFJ_REHEARSAL_URL ?? 'http://127.0.0.1:8793';
const adminHeaders = {
  'content-type': 'application/json',
  'oai-authenticated-user-id': 'fake-owner',
  'oai-authenticated-user-email': 'owner@example.test',
};

function futureDate(daysAway) {
  const date = new Date(Date.now() + daysAway * 24 * 60 * 60 * 1_000);
  return date.toISOString().slice(0, 10);
}

function displayedDate(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/London',
  }).format(new Date(`${value}T12:00:00Z`));
}

async function request(path, { method = 'GET', body, admin = false } = {}) {
  const options = {
    method,
    headers: admin
      ? adminHeaders
      : body !== undefined
        ? { 'content-type': 'application/json' }
        : undefined,
  };
  if (body !== undefined) options.body = JSON.stringify(body);
  const response = await fetch(new URL(path, baseUrl), options);
  const text = await response.text();
  let json = null;
  if (text.startsWith('{')) {
    json = JSON.parse(text);
  }
  return { response, text, json };
}

function assertOk(result, expectedStatus = 200) {
  assert.equal(result.response.status, expectedStatus, result.text);
  assert.equal(result.json?.ok, true, result.text);
}

async function currentPublicationGuard() {
  const admin = await request('/admin', { admin: true });
  assert.equal(admin.response.status, 200, admin.text);
  const matches = [
    ...admin.text.matchAll(
      /data-publication-revision="(\d+)" data-publication-snapshot="([^"]+)"/g,
    ),
  ];
  assert.equal(matches.length, 1, 'expected one exact private preview');
  return {
    expectedRevision: Number(matches[0][1]),
    expectedSnapshotHash: matches[0][2],
  };
}

const unique = Date.now().toString(36);
const repairTitle = `Throw-away repair ${unique}`;
const updateTitle = `Throw-away update ${unique}`;
const outcomeTitle = `Throw-away result ${unique}`;
const repairReviewDate = futureDate(14);
const nextReviewDate = futureDate(21);

const unsigned = await request('/api/admin/repairs', {
  method: 'POST',
  body: {
    title: repairTitle,
    summary: 'Invented words used only to prove the private maintenance gates.',
  },
});
assert.equal(unsigned.response.status, 403, unsigned.text);

assertOk(
  await request('/api/admin/repairs/CFJ-R002', {
    method: 'PATCH',
    admin: true,
    body: { stage: 'closed' },
  }),
);

const createdRepair = await request('/api/admin/repairs', {
  method: 'POST',
  admin: true,
  body: {
    title: repairTitle,
    summary: 'Invented words used only to prove the private maintenance gates.',
  },
});
assertOk(createdRepair, 201);
const repairId = createdRepair.json.reference;
assert.match(repairId, /^repair_[0-9a-f-]+$/);
const repairUuid = repairId.slice('repair_'.length);
const repairSlug = `throw-away-repair-${unique}-${repairUuid.slice(0, 8)}`;

const secondRepair = await request('/api/admin/repairs', {
  method: 'POST',
  admin: true,
  body: {
    title: `Second throw-away repair ${unique}`,
    summary: 'This unfinished second draft must be refused by the workshop.',
  },
});
assert.equal(secondRepair.response.status, 409, secondRepair.text);

const incompletePublish = await request(`/api/admin/repairs/${repairId}`, {
  method: 'PATCH',
  admin: true,
  body: {
    operation: 'publish-draft',
    noPrivateDetails: true,
    humanReviewed: true,
    covenantAligned: true,
  },
});
assert.equal(incompletePublish.response.status, 400, incompletePublish.text);

assertOk(
  await request(`/api/admin/repairs/${repairId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'draft-problem',
      title: repairTitle,
      summary:
        'Invented words used only to prove the private maintenance gates.',
      scope: 'One invented service and one invented repeatable barrier.',
      affectedGroups: 'Invented people blocked by the invented process.',
      knownFacts: 'The invented instructions contain one unclear step.',
      unknowns: 'We do not know how often the invented barrier would happen.',
      disputedClaims: 'None. Every word in this rehearsal is made up.',
    },
  }),
);

assertOk(
  await request(`/api/admin/repairs/${repairId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'draft-change',
      desiredChange:
        'An invented reader can finish the invented process without the barrier.',
      smallestTest:
        'Two invented readers check one revised step and record no personal data.',
    },
  }),
);

assertOk(
  await request(`/api/admin/repairs/${repairId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'draft-guard',
      safeguards:
        'Use invented data only and stop immediately if any real personal detail appears.',
      ownerName: 'Rehearsal owner',
      partnerName: 'Rehearsal checker',
      reviewDate: repairReviewDate,
    },
  }),
);

const createdAction = await request('/api/admin/actions', {
  method: 'POST',
  admin: true,
  body: { repairId },
});
assertOk(createdAction, 201);
const actionId = createdAction.json.reference;
assert.match(actionId, /^action_[0-9a-f-]+$/);

assertOk(
  await request(`/api/admin/actions/${actionId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'draft-basics',
      title: `Check the invented step ${unique}`,
      intendedOutput:
        'A short invented checklist with no names or private facts.',
      whyItMatters:
        'The repair is not useful unless the revised step can be checked.',
      timeSize: '20 minutes',
      compensation: 'Unpaid rehearsal using invented data only.',
    },
  }),
);

const privateStatusChange = await request(`/api/admin/actions/${actionId}`, {
  method: 'PATCH',
  admin: true,
  body: { status: 'verified' },
});
assert.equal(
  privateStatusChange.response.status,
  409,
  privateStatusChange.text,
);

assertOk(
  await request(`/api/admin/actions/${actionId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'draft-guard',
      skillsNeeded: 'Careful reading',
      locationMode: 'At home',
      ownerName: 'Rehearsal owner',
      reviewerName: 'Rehearsal checker',
      capacity: 2,
      evidenceRequired:
        'A checked list that contains no names or private facts.',
      reviewDate: repairReviewDate,
      stopCondition:
        'Stop after two invented checks or if any real detail appears.',
    },
  }),
);

const hiddenRepair = await request(`/repairs/${repairSlug}`);
assert.equal(hiddenRepair.response.status, 404, hiddenRepair.text);

const oldRepairGuard = await currentPublicationGuard();
assertOk(
  await request(`/api/admin/actions/${actionId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'draft-basics',
      title: `Check the invented step ${unique}`,
      intendedOutput:
        'A short invented checklist with no names, case files or private facts.',
      whyItMatters:
        'The repair is not useful unless the revised step can be checked.',
      timeSize: '20 minutes',
      compensation: 'Unpaid rehearsal using invented data only.',
    },
  }),
);
const staleRepairPublish = await request(`/api/admin/repairs/${repairId}`, {
  method: 'PATCH',
  admin: true,
  body: {
    operation: 'publish-draft',
    noPrivateDetails: true,
    humanReviewed: true,
    covenantAligned: true,
    ...oldRepairGuard,
  },
});
assert.equal(staleRepairPublish.response.status, 409, staleRepairPublish.text);
assert.equal((await request(`/repairs/${repairSlug}`)).response.status, 404);
const repairGuard = await currentPublicationGuard();

const duplicateRepairPublication = await Promise.all([
  request(`/api/admin/repairs/${repairId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'publish-draft',
      noPrivateDetails: true,
      humanReviewed: true,
      covenantAligned: true,
      ...repairGuard,
    },
  }),
  request(`/api/admin/repairs/${repairId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'publish-draft',
      noPrivateDetails: true,
      humanReviewed: true,
      covenantAligned: true,
      ...repairGuard,
    },
  }),
]);
assert.deepEqual(
  duplicateRepairPublication
    .map((result) => result.response.status)
    .sort((left, right) => left - right),
  [200, 409],
);

const publicRepair = await request(`/repairs/${repairSlug}`);
assert.equal(publicRepair.response.status, 200, publicRepair.text);
assert.match(publicRepair.text, new RegExp(repairTitle));
assert.match(
  publicRepair.text,
  new RegExp(`Check the invented step ${unique}`),
);
assert.match(publicRepair.text, /Stopped/);

const createdUpdate = await request('/api/admin/updates', {
  method: 'POST',
  admin: true,
  body: {
    repairId,
    title: updateTitle,
    body: 'The invented maintenance rehearsal reached its private update step.',
    evidenceChanged:
      'The real routes kept the invented repair private until publication.',
    remainsUnfair:
      'No real fairness problem was tested or repaired by this rehearsal.',
    nextOwner: 'Rehearsal owner',
    nextReviewDate,
  },
});
assertOk(createdUpdate, 201);
const updateId = createdUpdate.json.reference;
assert.match(updateId, /^update_[0-9a-f-]+$/);

const secondUpdate = await request('/api/admin/updates', {
  method: 'POST',
  admin: true,
  body: {
    repairId,
    title: `Second throw-away update ${unique}`,
    body: 'This second private update must be refused until the first is finished.',
    evidenceChanged: 'Nothing changed because this is invented test data.',
    remainsUnfair: 'No real fairness problem is part of this rehearsal.',
    nextOwner: 'Rehearsal owner',
    nextReviewDate,
  },
});
assert.equal(secondUpdate.response.status, 409, secondUpdate.text);

const hiddenUpdate = await request(`/repairs/${repairSlug}`);
assert.doesNotMatch(hiddenUpdate.text, new RegExp(updateTitle));

const oldUpdateGuard = await currentPublicationGuard();
assertOk(
  await request(`/api/admin/updates/${updateId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      title: updateTitle,
      body: 'The invented rehearsal reached its changed private update step.',
      evidenceChanged:
        'The real routes kept the invented repair private until publication.',
      remainsUnfair:
        'No real fairness problem was tested or repaired by this rehearsal.',
      nextOwner: 'Rehearsal owner',
      nextReviewDate,
    },
  }),
);
const staleUpdatePublish = await request(`/api/admin/updates/${updateId}`, {
  method: 'PATCH',
  admin: true,
  body: {
    operation: 'publish',
    noPrivateDetails: true,
    humanReviewed: true,
    ...oldUpdateGuard,
  },
});
assert.equal(staleUpdatePublish.response.status, 409, staleUpdatePublish.text);
const afterStaleUpdate = await request(`/repairs/${repairSlug}`);
assert.doesNotMatch(afterStaleUpdate.text, new RegExp(updateTitle));
assert.match(
  afterStaleUpdate.text,
  new RegExp(displayedDate(repairReviewDate)),
);
const updateGuard = await currentPublicationGuard();

assertOk(
  await request(`/api/admin/updates/${updateId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'publish',
      noPrivateDetails: true,
      humanReviewed: true,
      ...updateGuard,
    },
  }),
);

const publicUpdate = await request(`/repairs/${repairSlug}`);
assert.equal(publicUpdate.response.status, 200, publicUpdate.text);
assert.match(publicUpdate.text, new RegExp(updateTitle));
assert.match(publicUpdate.text, new RegExp(displayedDate(nextReviewDate)));

const createdOutcome = await request('/api/admin/outcomes', {
  method: 'POST',
  admin: true,
  body: {
    repairId,
    title: outcomeTitle,
    activity: 'We ran one invented and tightly bounded maintenance check.',
    observedEffect:
      'The private draft stayed hidden until its separate publication step.',
    evidence:
      'This rehearsal route and its invented public proof link record the method.',
    evidenceUrl: 'https://example.org/invented-proof',
    confidence: 'observed',
    verifierName: 'Rehearsal checker',
    whoBenefited: 'Only the invented reader in this maintenance rehearsal.',
    whatDidNotChange: 'No real service, policy or fairness problem changed.',
    learning:
      'A private draft and a separate exact review make publishing safer.',
    sourceMode: 'public_evidence_only',
  },
});
assertOk(createdOutcome, 201);
const outcomeId = createdOutcome.json.reference;
assert.match(outcomeId, /^outcome_[0-9a-f-]+$/);
assert.doesNotMatch(
  (await request('/outcomes')).text,
  new RegExp(outcomeTitle),
);

const outcomeGuardOne = await currentPublicationGuard();
assertOk(
  await request(`/api/admin/outcomes/${outcomeId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'review',
      humanReviewed: true,
      noPrivateDetails: true,
      noPrivateRepliesUsed: true,
      publicEvidenceOpened: true,
      publicEvidenceContainsNoPrivateMaterial: true,
      ...outcomeGuardOne,
    },
  }),
);
assertOk(
  await request(`/api/admin/outcomes/${outcomeId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'save',
      title: outcomeTitle,
      activity: 'We ran one invented and tightly bounded maintenance check.',
      observedEffect:
        'The private draft stayed hidden until its separate publication step.',
      evidence:
        'This rehearsal route and its invented public proof link record the method.',
      evidenceUrl: 'https://example.org/invented-proof',
      confidence: 'observed',
      verifierName: 'Rehearsal checker',
      whoBenefited: 'Only the invented reader in this maintenance rehearsal.',
      whatDidNotChange: 'No real service, policy or fairness problem changed.',
      learning:
        'A changed private draft must be checked again before it can go public.',
      sourceMode: 'public_evidence_only',
    },
  }),
);
const staleOutcomePublish = await request(`/api/admin/outcomes/${outcomeId}`, {
  method: 'PATCH',
  admin: true,
  body: {
    operation: 'publish',
    publishExactReviewedDraft: true,
    eraseFullRepliesIfUsed: false,
    ...outcomeGuardOne,
  },
});
assert.equal(
  staleOutcomePublish.response.status,
  409,
  staleOutcomePublish.text,
);
assert.doesNotMatch(
  (await request('/outcomes')).text,
  new RegExp(outcomeTitle),
);

const outcomeGuardTwo = await currentPublicationGuard();
assertOk(
  await request(`/api/admin/outcomes/${outcomeId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'review',
      humanReviewed: true,
      noPrivateDetails: true,
      noPrivateRepliesUsed: true,
      publicEvidenceOpened: true,
      publicEvidenceContainsNoPrivateMaterial: true,
      ...outcomeGuardTwo,
    },
  }),
);
assertOk(
  await request(`/api/admin/outcomes/${outcomeId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'publish',
      publishExactReviewedDraft: true,
      eraseFullRepliesIfUsed: false,
      ...outcomeGuardTwo,
    },
  }),
);
const publicOutcome = await request('/outcomes');
assert.match(publicOutcome.text, new RegExp(outcomeTitle));
assert.match(publicOutcome.text, /Rehearsal checker/);
assert.match(publicOutcome.text, /Only the invented reader/);
assert.match(publicOutcome.text, /Open the public proof/);
assert.match(publicOutcome.text, /No private reply was used/);

const scheduledCleanup = await request('/cdn-cgi/local/scheduled');
assert.equal(scheduledCleanup.response.status, 200, scheduledCleanup.text);
assert.equal(scheduledCleanup.text, 'ok');
const adminAfterCleanup = await request('/admin', { admin: true });
assert.equal(adminAfterCleanup.response.status, 200, adminAfterCleanup.text);
assert.match(adminAfterCleanup.text, /Automatic deletion check working/);

assertOk(
  await request(`/api/admin/repairs/${repairId}`, {
    method: 'PATCH',
    admin: true,
    body: { stage: 'stopped' },
  }),
);

console.log(
  JSON.stringify({
    ok: true,
    repairId,
    actionId,
    updateId,
    outcomeId,
    repairSlug,
    checks: 43,
  }),
);
