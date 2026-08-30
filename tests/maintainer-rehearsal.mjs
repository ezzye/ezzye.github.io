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

const unique = Date.now().toString(36);
const repairTitle = `Throw-away repair ${unique}`;
const updateTitle = `Throw-away update ${unique}`;
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
assert.equal(incompletePublish.response.status, 409, incompletePublish.text);

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

assertOk(
  await request(`/api/admin/repairs/${repairId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'publish-draft',
      noPrivateDetails: true,
      humanReviewed: true,
      covenantAligned: true,
    },
  }),
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

assertOk(
  await request(`/api/admin/updates/${updateId}`, {
    method: 'PATCH',
    admin: true,
    body: {
      operation: 'publish',
      noPrivateDetails: true,
      humanReviewed: true,
    },
  }),
);

const publicUpdate = await request(`/repairs/${repairSlug}`);
assert.equal(publicUpdate.response.status, 200, publicUpdate.text);
assert.match(publicUpdate.text, new RegExp(updateTitle));
assert.match(publicUpdate.text, new RegExp(displayedDate(nextReviewDate)));

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
    repairSlug,
    checks: 20,
  }),
);
