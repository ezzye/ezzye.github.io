import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
process.env.WRANGLER_WRITE_LOGS = 'false';
process.env.WRANGLER_LOG_PATH = `${projectRoot}/.wrangler/logs`;
const { createTestHarness } = await import('wrangler');
const adminHeaders = {
  'content-type': 'application/json',
  'oai-authenticated-user-id': 'fake-owner',
  'oai-authenticated-user-email': 'owner@example.test',
};

function futureDate(daysAway) {
  const date = new Date(Date.now() + daysAway * 24 * 60 * 60 * 1_000);
  return date.toISOString().slice(0, 10);
}

const reviewDate = futureDate(14);
const deleteDate = futureDate(30);
const retentionSecret = 'r'.repeat(64);
const server = createTestHarness({
  root: projectRoot,
  workers: [
    {
      configPath: 'tests/wrangler.rehearsal.json',
      vars: {
        ADMIN_EMAIL: 'owner@example.test',
        PUBLIC_CONTACT_EMAIL: 'privacy@example.test',
        PUBLIC_DATA_OWNER: 'Coding for Justice rehearsal',
        PUBLIC_PRIVACY_REPLY_TIME: '30 days',
        PUBLIC_LAWFUL_BASIS: 'Consent for this invented rehearsal',
        PUBLIC_DATA_RECIPIENTS: 'The named rehearsal owner only',
        PILOT_RESPONSE_DELETE_DATE: deleteDate,
        PILOT_PRIVACY_READY: 'true',
        PILOT_INVITES_AUTHORIZED: 'true',
        PILOT_INVITE_APPROVAL_REFERENCE: 'INVENTED-REHEARSAL-ONLY',
        PILOT_RECRUITMENT_PLAN: 'One invented one-use link at a time',
        PILOT_REPLY_READER: 'Rehearsal owner',
        RETENTION_CRON_SECRET: retentionSecret,
      },
    },
  ],
});

let failed = false;

try {
  const builtConfig = JSON.parse(
    await readFile(
      new URL('../dist/server/wrangler.json', import.meta.url),
      'utf8',
    ),
  );
  assert.equal(builtConfig.main, 'index.js');
  assert.deepEqual(builtConfig.triggers?.crons, ['*/15 * * * *']);

  await server.listen();
  const worker = server.getWorker();
  await worker.applyD1Migrations('DB');
  const environment = await worker.getEnv();
  const database = environment.DB;

  async function request(
    path,
    { method = 'GET', body, admin = false, authorization } = {},
  ) {
    const requestHeaders = admin
      ? { ...adminHeaders }
      : body === undefined
        ? {}
        : { 'content-type': 'application/json' };
    if (authorization) requestHeaders.authorization = authorization;
    const response = await server.fetch(path, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let json = null;
    if (text.startsWith('{')) json = JSON.parse(text);
    return { response, text, json };
  }

  function assertOk(result, status = 200) {
    assert.equal(result.response.status, status, result.text);
    assert.equal(result.json?.ok, true, result.text);
  }

  const home = await request('/');
  assert.equal(home.response.status, 200, home.text);
  assert.match(home.text, /Pick a small job\. Help fix something unfair\./);

  const generatedHome = await server.fetch(
    'https://coding-for-justice.ezzye.chatgpt.site/',
  );
  assert.equal(generatedHome.status, 200);
  assert.equal(generatedHome.headers.get('x-robots-tag'), 'noindex, nofollow');
  const publicHome = await server.fetch('https://codingforjustice.org.uk/');
  assert.equal(publicHome.status, 200);
  assert.equal(publicHome.headers.get('x-robots-tag'), null);

  assertOk(
    await request('/api/admin/actions/CFJ-A004', {
      method: 'PATCH',
      admin: true,
      body: {
        operation: 'pilot-settings',
        compensation: 'Unpaid invented rehearsal. Spend no money.',
        reviewerName: 'Rehearsal checker',
        reviewDate,
      },
    }),
  );
  assertOk(
    await request('/api/admin/actions/CFJ-A004', {
      method: 'PATCH',
      admin: true,
      body: { operation: 'approve-pilot-terms' },
    }),
  );

  const beforeHeartbeat = await request('/api/admin/action-invites', {
    method: 'POST',
    admin: true,
    body: { actionId: 'CFJ-A004' },
  });
  assert.equal(beforeHeartbeat.response.status, 409, beforeHeartbeat.text);

  const retentionStateBeforeAuth = await database
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM retention_sweeps) AS sweeps,
         (SELECT COUNT(*) FROM retention_events) AS events`,
    )
    .first();
  const missingSecret = await request('/api/internal/retention', {
    method: 'POST',
  });
  assert.equal(missingSecret.response.status, 404, missingSecret.text);
  assert.equal(
    missingSecret.response.headers.get('cache-control'),
    'private, no-store',
  );
  const wrongSecret = await request('/api/internal/retention', {
    method: 'POST',
    authorization: `Bearer ${'w'.repeat(64)}`,
  });
  assert.equal(wrongSecret.response.status, 404, wrongSecret.text);
  const retentionStateAfterRejectedAuth = await database
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM retention_sweeps) AS sweeps,
         (SELECT COUNT(*) FROM retention_events) AS events`,
    )
    .first();
  assert.deepEqual(retentionStateAfterRejectedAuth, retentionStateBeforeAuth);

  assertOk(
    await request('/api/internal/retention', {
      method: 'POST',
      authorization: `Bearer ${retentionSecret}`,
    }),
  );
  const firstHeartbeat = await database
    .prepare(
      `SELECT last_completed_at, last_error_at, run_count
       FROM retention_sweeps WHERE id = 'action_responses'`,
    )
    .first();
  assert.ok(firstHeartbeat?.last_completed_at);
  assert.equal(firstHeartbeat?.last_error_at, null);
  assert.equal(Number(firstHeartbeat?.run_count), 1);

  const firstInvite = await request('/api/admin/action-invites', {
    method: 'POST',
    admin: true,
    body: { actionId: 'CFJ-A004' },
  });
  assertOk(firstInvite, 201);
  const firstToken = new URL(firstInvite.json.invite.url).searchParams.get(
    'invite',
  );
  assert.ok(firstToken);
  assertOk(
    await request('/api/admin/actions/CFJ-A004', {
      method: 'PATCH',
      admin: true,
      body: { isPreview: false },
    }),
  );

  await database
    .prepare(
      `UPDATE retention_sweeps SET last_completed_at = ?, last_error_at = NULL
       WHERE id = 'action_responses'`,
    )
    .bind(new Date(Date.now() - 46 * 60 * 1_000).toISOString())
    .run();
  const staleAdmin = await request('/admin', { admin: true });
  assert.equal(staleAdmin.response.status, 200, staleAdmin.text);
  assert.match(staleAdmin.text, /automatic deletion check is late/i);
  const staleInvite = await request('/api/admin/action-invites', {
    method: 'POST',
    admin: true,
    body: { actionId: 'CFJ-A004' },
  });
  assert.equal(staleInvite.response.status, 409, staleInvite.text);

  const action = await database
    .prepare(
      `SELECT response_questions FROM action_cards WHERE id = 'CFJ-A004'`,
    )
    .first();
  const questions = JSON.parse(action.response_questions);
  const replyBody = {
    actionId: 'CFJ-A004',
    inviteToken: firstToken,
    companyWebsite: '',
    answers: questions.map((_, index) => `Invented answer ${index + 1}.`),
    consentPrivateUse: true,
    consentAnonymousSummary: false,
    confirmedAdult: true,
  };
  const staleReply = await request('/api/action-responses', {
    method: 'POST',
    body: replyBody,
  });
  assert.equal(staleReply.response.status, 409, staleReply.text);
  assert.equal(
    Number(
      (
        await database
          .prepare(`SELECT COUNT(*) AS count FROM action_responses`)
          .first()
      ).count,
    ),
    0,
  );

  const recoveredSweep = await worker.scheduled({
    cron: '*/15 * * * *',
    scheduledTime: new Date(),
  });
  assert.equal(recoveredSweep.outcome, 'ok');
  const acceptedReply = await request('/api/action-responses', {
    method: 'POST',
    body: replyBody,
  });
  assertOk(acceptedReply, 201);
  const responseId = acceptedReply.json.reference;

  const secondInvite = await request('/api/admin/action-invites', {
    method: 'POST',
    admin: true,
    body: { actionId: 'CFJ-A004' },
  });
  assertOk(secondInvite, 201);
  const secondToken = new URL(secondInvite.json.invite.url).searchParams.get(
    'invite',
  );
  assert.ok(secondToken);

  const withdrawalInvite = await request('/api/admin/action-invites', {
    method: 'POST',
    admin: true,
    body: { actionId: 'CFJ-A004' },
  });
  assertOk(withdrawalInvite, 201);
  const withdrawalToken = new URL(
    withdrawalInvite.json.invite.url,
  ).searchParams.get('invite');
  assert.ok(withdrawalToken);
  const withdrawalReply = await request('/api/action-responses', {
    method: 'POST',
    body: { ...replyBody, inviteToken: withdrawalToken },
  });
  assertOk(withdrawalReply, 201);
  assertOk(
    await request(
      `/api/admin/action-responses/${withdrawalReply.json.reference}`,
      { method: 'DELETE', admin: true },
    ),
  );
  const withdrawalState = await database
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM action_responses WHERE id = ?) AS replies,
         (SELECT COUNT(*) FROM action_invites WHERE id = ?) AS invites`,
    )
    .bind(withdrawalReply.json.reference, withdrawalInvite.json.invite.id)
    .first();
  assert.deepEqual(
    {
      replies: Number(withdrawalState.replies),
      invites: Number(withdrawalState.invites),
    },
    { replies: 0, invites: 0 },
  );

  await database
    .prepare(
      `CREATE TRIGGER rehearsal_fail_retention
       BEFORE UPDATE ON retention_sweeps
       WHEN NEW.last_error_at IS NULL
       BEGIN
         SELECT RAISE(ABORT, 'invented retention failure');
       END`,
    )
    .run();
  const failedSweep = await request('/api/internal/retention', {
    method: 'POST',
    authorization: `Bearer ${retentionSecret}`,
  });
  assert.equal(failedSweep.response.status, 500, failedSweep.text);
  const failedHeartbeat = await database
    .prepare(
      `SELECT last_completed_at, last_error_at, run_count
       FROM retention_sweeps WHERE id = 'action_responses'`,
    )
    .first();
  assert.ok(failedHeartbeat?.last_completed_at);
  assert.ok(failedHeartbeat?.last_error_at);
  assert.equal(Number(failedHeartbeat?.run_count), 3);
  assert.ok(
    Date.parse(failedHeartbeat.last_error_at) >=
      Date.parse(failedHeartbeat.last_completed_at),
  );
  assert.equal(
    Number(
      (
        await database
          .prepare(`SELECT COUNT(*) AS count FROM action_responses`)
          .first()
      ).count,
    ),
    1,
  );

  await database.prepare(`DROP TRIGGER rehearsal_fail_retention`).run();
  const failedAdmin = await request('/admin', { admin: true });
  assert.equal(failedAdmin.response.status, 200, failedAdmin.text);
  assert.match(failedAdmin.text, /automatic deletion check failed/i);
  const failedInvite = await request('/api/admin/action-invites', {
    method: 'POST',
    admin: true,
    body: { actionId: 'CFJ-A004' },
  });
  assert.equal(failedInvite.response.status, 409, failedInvite.text);
  const failedReply = await request('/api/action-responses', {
    method: 'POST',
    body: { ...replyBody, inviteToken: secondToken },
  });
  assert.equal(failedReply.response.status, 409, failedReply.text);

  await database
    .prepare(`UPDATE action_responses SET delete_after = ? WHERE id = ?`)
    .bind(new Date(Date.now() - 60_000).toISOString(), responseId)
    .run();
  const cleanupSweep = await worker.scheduled({
    cron: '*/15 * * * *',
    scheduledTime: new Date(),
  });
  assert.equal(cleanupSweep.outcome, 'ok');
  const cleanupState = await database
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM action_responses) AS replies,
         (SELECT status FROM action_cards WHERE id = 'CFJ-A004') AS status,
         (SELECT is_preview FROM action_cards WHERE id = 'CFJ-A004') AS preview,
         (SELECT pilot_terms_approved_at IS NULL FROM action_cards
          WHERE id = 'CFJ-A004') AS approval_cleared,
         (SELECT revoked_at IS NOT NULL FROM action_invites
          WHERE id = ?) AS second_invite_revoked,
         (SELECT COUNT(*) FROM retention_events
          WHERE trigger = 'automatic') AS automatic_events,
         (SELECT records_deleted FROM retention_events
          WHERE trigger = 'automatic' ORDER BY completed_at DESC LIMIT 1)
           AS records_deleted,
         (SELECT last_error_at IS NULL FROM retention_sweeps
          WHERE id = 'action_responses') AS error_cleared`,
    )
    .bind(secondInvite.json.invite.id)
    .first();
  assert.deepEqual(
    {
      replies: Number(cleanupState.replies),
      status: cleanupState.status,
      preview: Number(cleanupState.preview),
      approvalCleared: Number(cleanupState.approval_cleared),
      secondInviteRevoked: Number(cleanupState.second_invite_revoked),
      automaticEvents: Number(cleanupState.automatic_events),
      recordsDeleted: Number(cleanupState.records_deleted),
      errorCleared: Number(cleanupState.error_cleared),
    },
    {
      replies: 0,
      status: 'stopped',
      preview: 1,
      approvalCleared: 1,
      secondInviteRevoked: 1,
      automaticEvents: 1,
      recordsDeleted: 1,
      errorCleared: 1,
    },
  );

  const beforeIdempotent = await database
    .prepare(
      `SELECT run_count FROM retention_sweeps WHERE id = 'action_responses'`,
    )
    .first();
  const idempotentSweep = await worker.scheduled({
    cron: '*/15 * * * *',
    scheduledTime: new Date(),
  });
  assert.equal(idempotentSweep.outcome, 'ok');
  const afterIdempotent = await database
    .prepare(
      `SELECT run_count, last_records_deleted FROM retention_sweeps
       WHERE id = 'action_responses'`,
    )
    .first();
  assert.equal(
    Number(afterIdempotent.run_count),
    Number(beforeIdempotent.run_count) + 1,
  );
  assert.equal(Number(afterIdempotent.last_records_deleted), 0);

  process.stdout.write(
    `${JSON.stringify({ ok: true, checks: 55, responseId })}\n`,
  );
} catch (error) {
  failed = true;
  server.debug();
  throw error;
} finally {
  await server.close();
  if (failed) process.exitCode = 1;
}
