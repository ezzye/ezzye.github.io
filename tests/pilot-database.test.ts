import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { RESERVE_ACTION_INVITE_SQL } from '../lib/action-invite-sql.ts';
import {
  DELETE_EXPIRED_ACTION_INVITES_SQL,
  DELETE_EXPIRED_RATE_LIMITS_SQL,
  DELETE_DUE_ACTION_RESPONSES_SQL,
  REVOKE_DUE_RESPONSE_INVITES_SQL,
  STOP_DUE_RESPONSE_ACTIONS_SQL,
} from '../lib/response-retention-sql.ts';
import {
  APPLY_PUBLISHED_UPDATE_TO_REPAIR_SQL,
  PUBLISH_REPAIR_DRAFT_SQL,
  PUBLISH_REPAIR_UPDATE_DRAFT_SQL,
} from '../lib/publication-sql.ts';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const migrationNames = readdirSync(join(projectRoot, 'drizzle'))
  .filter((name) => /^\d{4}_.+\.sql$/.test(name))
  .sort();

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function migrationSql(names: string[]): string {
  return names
    .map((name) => readFileSync(join(projectRoot, 'drizzle', name), 'utf8'))
    .join('\n');
}

function applySql(database: string, sql: string): void {
  execFileSync('sqlite3', [database], {
    input: `PRAGMA foreign_keys = ON;\n${sql}`,
  });
}

function bindReservation(values: string[]): string {
  assert.equal(values.length, 11, 'reservation SQL has eleven bound values');
  let sql = RESERVE_ACTION_INVITE_SQL;
  for (let index = values.length; index >= 1; index -= 1) {
    sql = sql.replaceAll(`?${index}`, sqlLiteral(values[index - 1]!));
  }
  return `${sql};`;
}

function bindRetention(
  sql: string,
  now: string,
  policyCutoff: string | null = null,
): string {
  return `${sql
    .replaceAll('?1', sqlLiteral(now))
    .replaceAll(
      '?2',
      policyCutoff === null ? 'NULL' : sqlLiteral(policyCutoff),
    )};`;
}

function bindNumberedSql(
  sql: string,
  values: Array<string | number | null>,
): string {
  let bound = sql;
  for (let index = values.length; index >= 1; index -= 1) {
    const value = values[index - 1];
    const literal =
      value === null
        ? 'NULL'
        : typeof value === 'number'
          ? String(value)
          : sqlLiteral(value);
    bound = bound.replaceAll(`?${index}`, literal);
  }
  return `${bound};`;
}

void test('fresh migrations enforce invitation integrity and capacity', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cfj-pilot-db-'));
  const database = join(directory, 'test.sqlite');
  try {
    applySql(database, migrationSql(migrationNames));

    const schemaCheck = execFileSync('sqlite3', [database], {
      input: `
          PRAGMA foreign_key_check;
          SELECT COUNT(*) FROM pragma_table_info('action_cards')
            WHERE name IN ('pilot_terms_approved_at', 'pilot_approval_snapshot');
          SELECT COUNT(*) FROM pragma_table_info('action_responses')
            WHERE name = 'delete_after';
          SELECT COUNT(*) FROM sqlite_master
            WHERE type = 'table' AND name = 'retention_events';
          SELECT COUNT(*) FROM sqlite_master
            WHERE type = 'trigger'
              AND name = 'action_response_invite_required_insert';
          SELECT COUNT(*) FROM sqlite_master
            WHERE type = 'trigger' AND name LIKE 'action_response_invite_matches_%';
          SELECT COUNT(*) FROM sqlite_master
            WHERE type = 'trigger' AND name LIKE 'action_response_retention_%';
          SELECT COUNT(*) FROM sqlite_master
            WHERE type = 'trigger' AND name LIKE 'action_response_consent_%';
          SELECT COUNT(*) FROM sqlite_master
            WHERE type = 'index' AND name = 'idx_action_responses_delete_after';
        `,
    })
      .toString()
      .trim()
      .split('\n');
    assert.deepEqual(schemaCheck, ['2', '1', '1', '1', '2', '2', '2', '1']);

    const preparedPilot = execFileSync('sqlite3', [database], {
      input: `
        SELECT response_questions FROM action_cards WHERE id = 'CFJ-A004';
        SELECT why_it_matters FROM action_cards WHERE id = 'CFJ-A004';
        SELECT is_preview || '|' || (pilot_terms_approved_at IS NULL)
          FROM action_cards WHERE id = 'CFJ-A004';
        SELECT COUNT(*) FROM action_invites WHERE action_id = 'CFJ-A004';
        SELECT COUNT(*) FROM action_responses WHERE action_id = 'CFJ-A004';
      `,
    })
      .toString()
      .trim()
      .split('\n');
    assert.deepEqual(preparedPilot, [
      '["After reading the home page, how would you explain Coding for Justice to someone else?","What did the page add, clear up or leave muddled about the goal?","What would you click first?","How does the page feel? What on the page made it feel that way?","Did anything feel unclear, unsafe or pushy?"]',
      'The invitation gives people the broad aim. The page still needs to make that aim clear, show a useful next step and feel warm rather than official.',
      '1|1',
      '0',
      '0',
    ]);

    const settings = {
      compensation: 'Test pay',
      reviewer: 'Test reviewer',
      reviewDate: '2099-12-31',
      approvedAt: '2026-08-30T12:00:00.000Z',
      approvalSnapshot: '{"version":1,"terms":"first"}',
      expiry: '2099-12-31T23:59:59.000Z',
    };
    const reservation = (
      id: string,
      tokenCharacter: string,
      approvalSnapshot = settings.approvalSnapshot,
    ) =>
      bindReservation([
        id,
        tokenCharacter.repeat(64),
        settings.expiry,
        '2026-08-30T12:00:00.000Z',
        'CFJ-A004',
        settings.compensation,
        settings.reviewer,
        settings.reviewDate,
        settings.approvedAt,
        approvalSnapshot,
        settings.expiry,
      ]);
    const reservations = Array.from({ length: 6 }, (_, index) =>
      reservation(`invite_${index}`, String(index)),
    ).join('\n');
    const count = execFileSync('sqlite3', [database], {
      input: `
        UPDATE action_cards
        SET compensation = ${sqlLiteral(settings.compensation)},
          reviewer_name = ${sqlLiteral(settings.reviewer)},
          review_date = ${sqlLiteral(settings.reviewDate)},
          pilot_terms_approved_at = ${sqlLiteral(settings.approvedAt)},
          pilot_approval_snapshot = ${sqlLiteral(settings.approvalSnapshot)},
          capacity = 5
        WHERE id = 'CFJ-A004';
        ${reservations}
        SELECT COUNT(*) FROM action_invites WHERE action_id = 'CFJ-A004';
      `,
    })
      .toString()
      .trim();
    assert.equal(count, '5');

    const changedSnapshot = '{"version":1,"terms":"changed"}';
    const snapshotCounts = execFileSync('sqlite3', [database], {
      input: `
        DELETE FROM action_invites WHERE action_id = 'CFJ-A004';
        UPDATE action_cards
        SET pilot_approval_snapshot = ${sqlLiteral(changedSnapshot)}
        WHERE id = 'CFJ-A004';
        ${reservation('invite_stale', 'a')}
        SELECT COUNT(*) FROM action_invites WHERE action_id = 'CFJ-A004';
        ${reservation('invite_current', 'b', changedSnapshot)}
        SELECT COUNT(*) FROM action_invites WHERE action_id = 'CFJ-A004';
      `,
    })
      .toString()
      .trim()
      .split('\n');
    assert.deepEqual(snapshotCounts, ['0', '1']);

    const missingInvite = spawnSync('sqlite3', [database], {
      input: `
        INSERT INTO action_responses (
          id, action_id, invite_id, questions, answers,
          consent_private_use, consent_anonymous_summary, confirmed_adult,
          status, delete_after, created_at, updated_at
        ) VALUES (
          'missing_invite', 'CFJ-A004', NULL, '[]', '[]',
          1, 0, 1, 'new', '2099-12-31T23:59:59.000Z',
          '2026-08-30T12:00:00.000Z',
          '2026-08-30T12:00:00.000Z'
        );
      `,
      encoding: 'utf8',
    });
    assert.notEqual(missingInvite.status, 0);
    assert.match(missingInvite.stderr, /invitation is required/i);

    const mismatch = spawnSync('sqlite3', [database], {
      input: `
        INSERT INTO action_responses (
          id, action_id, invite_id, questions, answers,
          consent_private_use, consent_anonymous_summary, confirmed_adult,
          status, delete_after, created_at, updated_at
        ) VALUES (
          'bad_response', 'CFJ-A001', 'invite_current', '[]', '[]',
          1, 0, 1, 'new', '2099-12-31T23:59:59.000Z',
          '2026-08-30T12:00:00.000Z',
          '2026-08-30T12:00:00.000Z'
        );
      `,
      encoding: 'utf8',
    });
    assert.notEqual(mismatch.status, 0);
    assert.match(mismatch.stderr, /does not belong to this action/i);

    const missingRetention = spawnSync('sqlite3', [database], {
      input: `
        INSERT INTO action_responses (
          id, action_id, invite_id, questions, answers,
          consent_private_use, consent_anonymous_summary, confirmed_adult,
          status, delete_after, created_at, updated_at
        ) VALUES (
          'missing_retention', 'CFJ-A004', 'invite_current', '[]', '[]',
          1, 0, 1, 'new', NULL, '2026-08-30T12:00:00.000Z',
          '2026-08-30T12:00:00.000Z'
        );
      `,
      encoding: 'utf8',
    });
    assert.notEqual(missingRetention.status, 0);
    assert.match(missingRetention.stderr, /future deletion deadline/i);

    const missingConsent = spawnSync('sqlite3', [database], {
      input: `
        INSERT INTO action_responses (
          id, action_id, invite_id, questions, answers,
          consent_private_use, consent_anonymous_summary, confirmed_adult,
          status, delete_after, created_at, updated_at
        ) VALUES (
          'missing_consent', 'CFJ-A004', 'invite_current', '[]', '[]',
          0, 0, 1, 'new', '2099-12-31T23:59:59.000Z',
          '2026-08-30T12:00:00.000Z', '2026-08-30T12:00:00.000Z'
        );
      `,
      encoding: 'utf8',
    });
    assert.notEqual(missingConsent.status, 0);
    assert.match(missingConsent.stderr, /consent and adult confirmation/i);

    applySql(
      database,
      `
        INSERT INTO action_responses (
          id, action_id, invite_id, questions, answers,
          consent_private_use, consent_anonymous_summary, confirmed_adult,
          status, delete_after, created_at, updated_at
        ) VALUES (
          'retention_response', 'CFJ-A004', 'invite_current', '[]', '["fake"]',
          1, 0, 1, 'new', '2099-12-31T23:59:59.000Z',
          '2026-08-30T12:00:00.000Z', '2026-08-30T12:00:00.000Z'
        );
        UPDATE action_responses
        SET delete_after = '2000-01-01T00:00:00.000Z'
        WHERE id = 'retention_response';
      `,
    );

    const removeConsent = spawnSync('sqlite3', [database], {
      input: `
        UPDATE action_responses SET consent_private_use = 0
        WHERE id = 'retention_response';
      `,
      encoding: 'utf8',
    });
    assert.notEqual(removeConsent.status, 0);
    assert.match(removeConsent.stderr, /cannot be removed/i);

    const extendRetention = spawnSync('sqlite3', [database], {
      input: `
        UPDATE action_responses
        SET delete_after = '2100-01-01T00:00:00.000Z'
        WHERE id = 'retention_response';
      `,
      encoding: 'utf8',
    });
    assert.notEqual(extendRetention.status, 0);
    assert.match(extendRetention.stderr, /cannot be removed or extended/i);

    const cutoff = '2026-08-30T12:00:00.000Z';
    applySql(
      database,
      [
        bindRetention(STOP_DUE_RESPONSE_ACTIONS_SQL, cutoff),
        bindRetention(REVOKE_DUE_RESPONSE_INVITES_SQL, cutoff),
        bindRetention(DELETE_DUE_ACTION_RESPONSES_SQL, cutoff),
      ].join('\n'),
    );
    const retentionState = execFileSync('sqlite3', [database], {
      input: `
        SELECT COUNT(*) FROM action_responses
          WHERE id = 'retention_response';
        SELECT status || '|' || is_preview || '|' ||
          (pilot_terms_approved_at IS NULL) || '|' ||
          (pilot_approval_snapshot IS NULL)
          FROM action_cards WHERE id = 'CFJ-A004';
        SELECT revoked_at IS NOT NULL FROM action_invites
          WHERE id = 'invite_current';
      `,
    })
      .toString()
      .trim()
      .split('\n');
    assert.deepEqual(retentionState, ['0', 'stopped|1|1|1', '1']);

    applySql(
      database,
      [
        bindRetention(STOP_DUE_RESPONSE_ACTIONS_SQL, cutoff),
        bindRetention(REVOKE_DUE_RESPONSE_INVITES_SQL, cutoff),
        bindRetention(DELETE_DUE_ACTION_RESPONSES_SQL, cutoff),
      ].join('\n'),
    );

    applySql(
      database,
      `
        INSERT INTO action_invites (
          id, action_id, token_hash, expires_at, created_at
        ) VALUES (
          'invite_policy', 'CFJ-A004', '${'f'.repeat(64)}',
          '2099-12-31T23:59:59.000Z', '2026-08-30T12:00:00.000Z'
        );
        INSERT INTO action_responses (
          id, action_id, invite_id, questions, answers,
          consent_private_use, consent_anonymous_summary, confirmed_adult,
          status, delete_after, created_at, updated_at
        ) VALUES (
          'policy_response', 'CFJ-A004', 'invite_policy', '[]', '["fake"]',
          1, 0, 1, 'new', '2099-12-31T23:59:59.000Z',
          '2026-08-30T12:00:00.000Z', '2026-08-30T12:00:00.000Z'
        );
      `,
    );
    const earlierPolicyCutoff = '2000-01-01T00:00:00.000Z';
    applySql(
      database,
      [
        bindRetention(
          STOP_DUE_RESPONSE_ACTIONS_SQL,
          cutoff,
          earlierPolicyCutoff,
        ),
        bindRetention(
          REVOKE_DUE_RESPONSE_INVITES_SQL,
          cutoff,
          earlierPolicyCutoff,
        ),
        bindRetention(
          DELETE_DUE_ACTION_RESPONSES_SQL,
          cutoff,
          earlierPolicyCutoff,
        ),
      ].join('\n'),
    );
    const earlierPolicyState = execFileSync('sqlite3', [database], {
      input: `
        SELECT COUNT(*) FROM action_responses WHERE id = 'policy_response';
        SELECT revoked_at IS NOT NULL FROM action_invites
          WHERE id = 'invite_policy';
      `,
    })
      .toString()
      .trim()
      .split('\n');
    assert.deepEqual(earlierPolicyState, ['0', '1']);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

void test('the warm question migration preserves the closed pilot gates', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cfj-question-upgrade-'));
  const database = join(directory, 'test.sqlite');
  const earlier = migrationNames.filter((name) => name < '0012_');
  const upgrade = migrationNames.filter((name) => name >= '0012_');
  try {
    applySql(database, migrationSql(earlier));
    const publicationBefore = execFileSync('sqlite3', [database], {
      input: `
        SELECT publication_revision || '|' ||
          COALESCE(published_snapshot_hash, 'NULL')
        FROM repairs WHERE id = 'CFJ-R002';
      `,
    })
      .toString()
      .trim();

    applySql(database, migrationSql(upgrade));
    const state = execFileSync('sqlite3', [database], {
      input: `
        SELECT response_questions FROM action_cards WHERE id = 'CFJ-A004';
        SELECT is_preview || '|' || (pilot_terms_approved_at IS NULL) || '|' ||
          (pilot_approval_snapshot IS NULL)
        FROM action_cards WHERE id = 'CFJ-A004';
        SELECT COUNT(*) FROM action_invites WHERE action_id = 'CFJ-A004';
        SELECT COUNT(*) FROM action_responses WHERE action_id = 'CFJ-A004';
        SELECT publication_revision || '|' ||
          COALESCE(published_snapshot_hash, 'NULL')
        FROM repairs WHERE id = 'CFJ-R002';
      `,
    })
      .toString()
      .trim()
      .split('\n');

    assert.deepEqual(state, [
      '["After reading the home page, how would you explain Coding for Justice to someone else?","What did the page add, clear up or leave muddled about the goal?","What would you click first?","How does the page feel? What on the page made it feel that way?","Did anything feel unclear, unsafe or pushy?"]',
      '1|1|1',
      '0',
      '0',
      publicationBefore,
    ]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

void test('the warm question migration refuses an opened or changed pilot', () => {
  const earlier = migrationNames.filter((name) => name < '0012_');
  const upgrade = migrationNames.filter((name) => name >= '0012_');
  const oldQuestions =
    '["What do you think this site is?","Who might find this site useful, and why?","What would you click first?","How does the page feel? What on the page made it feel that way?","Did anything feel unclear, unsafe or pushy?"]';
  const oldReason =
    'If people cannot say what the site is or what to click, the page is still getting in their way.';
  const scenarios = [
    {
      name: 'approved terms',
      sql: `
        UPDATE action_cards
        SET pilot_terms_approved_at = '2026-08-31T08:00:00.000Z',
          pilot_approval_snapshot = '{"approved":true}'
        WHERE id = 'CFJ-A004';
      `,
    },
    {
      name: 'existing invite',
      sql: `
        INSERT INTO action_invites (
          id, action_id, token_hash, expires_at, created_at
        ) VALUES (
          'existing_invite', 'CFJ-A004', '${'d'.repeat(64)}',
          '2026-09-06T23:59:59.000Z', '2026-08-31T08:00:00.000Z'
        );
      `,
    },
    {
      name: 'existing response',
      sql: `
        INSERT INTO action_invites (
          id, action_id, token_hash, expires_at, created_at
        ) VALUES (
          'response_invite', 'CFJ-A004', '${'c'.repeat(64)}',
          '2099-12-31T23:59:59.000Z', '2026-08-31T08:00:00.000Z'
        );
        INSERT INTO action_responses (
          id, action_id, invite_id, questions, answers,
          consent_private_use, consent_anonymous_summary, confirmed_adult,
          status, delete_after, created_at, updated_at
        ) VALUES (
          'existing_response', 'CFJ-A004', 'response_invite', '[]', '["fake"]',
          1, 0, 1, 'new', '2099-12-31T23:59:59.000Z',
          '2026-08-31T08:00:00.000Z', '2026-08-31T08:00:00.000Z'
        );
      `,
    },
    {
      name: 'public response path',
      sql: `UPDATE action_cards SET is_preview = 0 WHERE id = 'CFJ-A004';`,
    },
    {
      name: 'stopped action',
      sql: `UPDATE action_cards SET status = 'stopped' WHERE id = 'CFJ-A004';`,
    },
    {
      name: 'unexpected wording',
      sql: `
        UPDATE action_cards SET response_questions = '["Already changed"]'
        WHERE id = 'CFJ-A004';
      `,
      expected: '["Already changed"]',
    },
    {
      name: 'unexpected reason',
      sql: `
        UPDATE action_cards SET why_it_matters = 'Already changed'
        WHERE id = 'CFJ-A004';
      `,
      expectedReason: 'Already changed',
    },
  ];

  for (const scenario of scenarios) {
    const directory = mkdtempSync(join(tmpdir(), 'cfj-question-guard-'));
    const database = join(directory, 'test.sqlite');
    try {
      applySql(database, migrationSql(earlier));
      applySql(database, scenario.sql);
      applySql(database, migrationSql(upgrade));
      const state = execFileSync('sqlite3', [database], {
        input: `
          SELECT response_questions FROM action_cards WHERE id = 'CFJ-A004';
          SELECT why_it_matters FROM action_cards WHERE id = 'CFJ-A004';
        `,
      })
        .toString()
        .trim()
        .split('\n');
      assert.deepEqual(
        state,
        [
          scenario.expected ?? oldQuestions,
          scenario.expectedReason ?? oldReason,
        ],
        scenario.name,
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

void test('retention cleanup removes expired bearer links and anti-spam rows', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cfj-pilot-cleanup-db-'));
  const database = join(directory, 'test.sqlite');
  try {
    applySql(database, migrationSql(migrationNames));
    applySql(
      database,
      `
        INSERT INTO action_invites (
          id, action_id, token_hash, expires_at, created_at
        ) VALUES (
          'invite_expired', 'CFJ-A004', '${'e'.repeat(64)}',
          '2026-08-29T12:00:00.000Z', '2026-08-28T12:00:00.000Z'
        );
        INSERT INTO rate_limits (key, count, reset_at)
        VALUES ('expired-key', 1, 1);
        ${bindRetention(
          DELETE_EXPIRED_ACTION_INVITES_SQL,
          '2026-08-30T12:00:00.000Z',
        )}
        ${bindNumberedSql(DELETE_EXPIRED_RATE_LIMITS_SQL, [2])}
      `,
    );
    const state = execFileSync('sqlite3', [database], {
      input: `
        SELECT COUNT(*) FROM action_invites WHERE id = 'invite_expired';
        SELECT COUNT(*) FROM rate_limits WHERE key = 'expired-key';
      `,
    })
      .toString()
      .trim()
      .split('\n');
    assert.deepEqual(state, ['0', '0']);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

void test('the new invite trigger preserves legacy responses', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cfj-pilot-legacy-db-'));
  const database = join(directory, 'test.sqlite');
  try {
    const earlierMigrations = migrationNames.filter((name) => name < '0006_');
    const pilotMigrations = migrationNames.filter((name) => name >= '0006_');
    applySql(database, migrationSql(earlierMigrations));
    applySql(
      database,
      `
        INSERT INTO action_responses (
          id, action_id, questions, answers, created_at, updated_at
        ) VALUES (
          'legacy_response', 'CFJ-A004', '[]', '[]',
          '2026-08-30T11:00:00.000Z', '2026-08-30T11:00:00.000Z'
        );
      `,
    );

    applySql(database, migrationSql(pilotMigrations));
    const legacy = execFileSync('sqlite3', [database], {
      input: `
        SELECT COUNT(*), SUM(invite_id IS NULL)
        FROM action_responses WHERE id = 'legacy_response';
      `,
    })
      .toString()
      .trim();
    assert.equal(legacy, '1|1');

    const extendLegacyRetention = spawnSync('sqlite3', [database], {
      input: `
        UPDATE action_responses
        SET delete_after = '2099-12-31T23:59:59.000Z'
        WHERE id = 'legacy_response';
      `,
      encoding: 'utf8',
    });
    assert.notEqual(extendLegacyRetention.status, 0);
    assert.match(
      extendLegacyRetention.stderr,
      /cannot be removed or extended/i,
    );

    const newNullResponse = spawnSync('sqlite3', [database], {
      input: `
        INSERT INTO action_responses (
          id, action_id, invite_id, questions, answers,
          consent_private_use, consent_anonymous_summary, confirmed_adult,
          status, delete_after, created_at, updated_at
        ) VALUES (
          'new_null_response', 'CFJ-A004', NULL, '[]', '[]',
          1, 0, 1, 'new', '2099-12-31T23:59:59.000Z',
          '2026-08-30T12:00:00.000Z',
          '2026-08-30T12:00:00.000Z'
        );
      `,
      encoding: 'utf8',
    });
    assert.notEqual(newNullResponse.status, 0);
    assert.match(newNullResponse.stderr, /invitation is required/i);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

void test('the 0011 upgrade preserves the old public outcome', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cfj-outcome-upgrade-'));
  const database = join(directory, 'test.sqlite');
  try {
    const earlier = migrationNames.filter((name) => name < '0011_');
    const upgrade = migrationNames.filter((name) => name >= '0011_');
    applySql(database, migrationSql(earlier));
    const before = execFileSync('sqlite3', [database], {
      input: `SELECT id || '|' || title FROM outcomes WHERE id = 'CFJ-O001';`,
    })
      .toString()
      .trim();
    applySql(database, migrationSql(upgrade));
    const after = execFileSync('sqlite3', [database], {
      input: `
        PRAGMA foreign_key_check;
        SELECT id || '|' || title || '|' || source_mode || '|' ||
          source_reply_count || '|' || publication_revision || '|' ||
          (created_at = published_at) || '|' || is_published
        FROM outcomes WHERE id = 'CFJ-O001';
        SELECT
          (instr(a.evidence_required, 'cannot be the source of a public result') > 0) || '|' ||
          (instr(r.desired_change, 'not proof for a public result') > 0) || '|' ||
          (instr(r.safeguards, 'cannot be the source of a public result') > 0) || '|' ||
          (instr(lower(a.evidence_required), 'nameless') = 0) || '|' ||
          (instr(lower(r.safeguards), 'nameless') = 0)
        FROM repairs r JOIN action_cards a ON a.repair_id = r.id
        WHERE r.id = 'CFJ-R002' AND a.id = 'CFJ-A004';
      `,
    })
      .toString()
      .trim();
    assert.equal(
      before,
      'CFJ-O001|In the made-up test, putting the date first worked better',
    );
    assert.equal(
      after,
      'CFJ-O001|In the made-up test, putting the date first worked better|public_evidence_only|0|1|1|1\n1|1|1|1|1',
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

void test('publication revisions and private outcome review are database enforced', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cfj-publication-db-'));
  const database = join(directory, 'test.sqlite');
  try {
    applySql(database, migrationSql(migrationNames));
    const schema = execFileSync('sqlite3', [database], {
      input: `
        SELECT COUNT(*) FROM pragma_table_info('repairs')
          WHERE name IN ('publication_revision', 'published_snapshot_hash');
        SELECT COUNT(*) FROM pragma_table_info('repair_updates')
          WHERE name IN ('publication_revision', 'published_snapshot_hash');
        SELECT COUNT(*) FROM pragma_table_info('outcomes')
          WHERE name IN (
            'source_mode', 'source_reply_count', 'publication_revision',
            'reviewed_revision', 'reviewed_snapshot_hash',
            'published_snapshot_hash', 'consent_checked_at', 'created_at',
            'updated_at'
          );
        SELECT COUNT(*) FROM sqlite_master
          WHERE type = 'trigger'
            AND name LIKE 'repair_publication_revision_after_%';
        SELECT COUNT(*) FROM sqlite_master
          WHERE type = 'trigger'
            AND name LIKE 'outcome_publication_revision_after_%';
        SELECT COUNT(*) FROM sqlite_master
          WHERE type = 'table' AND name IN (
            'outcome_response_sources', 'retention_sweeps'
          );
      `,
    })
      .toString()
      .trim()
      .split('\n');
    assert.deepEqual(schema, ['2', '2', '9', '4', '4', '2']);

    applySql(
      database,
      `
        INSERT INTO repairs (
          id, slug, title, summary, stage, scope, affected_groups,
          known_facts, unknowns, disputed_claims, desired_change,
          smallest_test, safeguards, owner_name, partner_name, review_date,
          updated_at, is_demo, is_published
        ) VALUES (
          'private_repair', 'private-repair', 'Private repair title',
          'A private repair summary long enough for the test.', 'framing',
          'One bounded service.', 'People blocked by the process.',
          'One fact is known.', 'One fact is not known.', 'No dispute.',
          'The path becomes fairer.', 'Try one small bounded check.',
          'Stop if anyone is put at risk.', 'Owner', 'Checker', '2099-12-31',
          '2026-08-30T12:00:00.000Z', 0, 0
        );
        INSERT INTO action_cards (
          id, repair_id, title, intended_output, why_it_matters, time_size,
          compensation, participation_mode, response_questions,
          skills_needed, location_mode, owner_name, reviewer_name, capacity,
          status, evidence_required, review_date, stop_condition, sort_order
        ) VALUES (
          'private_action', 'private_repair', 'One private job',
          'One checked note.', 'It tests the smallest change.', '30 minutes',
          'Paid test', 'offer', '[]', 'Careful reading', 'Remote', 'Owner',
          'Checker', 1, 'stopped', 'One checked note', '2099-12-31',
          'Stop after one check', 1
        );
        UPDATE action_cards SET title = 'One changed private job'
          WHERE id = 'private_action';
        DELETE FROM action_cards WHERE id = 'private_action';
        UPDATE repairs SET summary = 'A changed private repair summary.'
          WHERE id = 'private_repair';
        INSERT INTO repair_updates (
          id, repair_id, title, body, evidence_changed, remains_unfair,
          next_owner, next_review_date, published_at, is_published
        ) VALUES (
          'draft_update', 'CFJ-R002', 'Private weekly note',
          'A private weekly note with enough words.', 'One fact changed.',
          'One part is still unfair.', 'Owner', '2099-12-31',
          '2026-08-30T12:00:00.000Z', 0
        );
        UPDATE repair_updates SET body = 'The private weekly note changed.'
          WHERE id = 'draft_update';
        INSERT INTO outcomes (
          id, repair_id, title, activity, observed_effect, evidence,
          evidence_url, confidence, verifier_name, who_benefited,
          what_did_not_change, learning, source_mode, created_at, updated_at,
          is_published, sort_order
        ) VALUES (
          'draft_outcome', 'CFJ-R002', 'Private result draft',
          'We ran one small bounded check.', 'One public step became clearer.',
          'The public test page records the method.', 'https://example.org/proof',
          'observed', 'Test checker', 'People using the test page.',
          'No wider service changed.', 'Run a larger check next.',
          'public_evidence_only', '2026-08-30T12:00:00.000Z',
          '2026-08-30T12:00:00.000Z', 0, 999
        );
        UPDATE outcomes SET title = 'Changed private result draft'
          WHERE id = 'draft_outcome';
      `,
    );
    const revisions = execFileSync('sqlite3', [database], {
      input: `
        SELECT publication_revision FROM repairs WHERE id = 'private_repair';
        SELECT publication_revision FROM repairs WHERE id = 'CFJ-R002';
        SELECT publication_revision FROM repair_updates
          WHERE id = 'draft_update';
        SELECT publication_revision || '|' || (reviewed_revision IS NULL)
          FROM outcomes WHERE id = 'draft_outcome';
      `,
    })
      .toString()
      .trim()
      .split('\n');
    assert.deepEqual(revisions, ['5', '1', '2', '2|1']);

    const movedAction = spawnSync('sqlite3', [database], {
      input: `
        PRAGMA foreign_keys = ON;
        UPDATE action_cards
        SET repair_id = CASE
          WHEN repair_id = 'CFJ-R001' THEN 'CFJ-R002'
          ELSE 'CFJ-R001'
        END
        WHERE id = 'CFJ-A002';
      `,
      encoding: 'utf8',
    });
    assert.notEqual(movedAction.status, 0);
    assert.match(movedAction.stderr, /cannot be moved/i);

    const directPublish = spawnSync('sqlite3', [database], {
      input: `UPDATE outcomes SET is_published = 1 WHERE id = 'draft_outcome';`,
      encoding: 'utf8',
    });
    assert.notEqual(directPublish.status, 0);
    assert.match(directPublish.stderr, /must be reviewed/i);

    applySql(
      database,
      `
        UPDATE outcomes SET
          reviewed_revision = publication_revision,
          reviewed_snapshot_hash = 'v1:sha256:${'a'.repeat(64)}',
          published_snapshot_hash = 'v1:sha256:${'b'.repeat(64)}',
          consent_checked_at = '2026-08-30T12:00:00.000Z',
          published_at = '2026-08-30T12:00:00.000Z',
          is_published = 1
        WHERE id = 'draft_outcome';
        INSERT INTO outcomes (
          id, repair_id, title, activity, observed_effect, evidence,
          confidence, verifier_name, who_benefited, what_did_not_change,
          learning, source_mode, created_at, updated_at, is_published, sort_order
        ) VALUES (
          'second_draft', 'CFJ-R002', 'Second private result',
          'We ran one other bounded check.', 'One other thing was observed.',
          'A short public method note exists.', 'claimed', 'Checker',
          'People using the page.', 'No wider service changed.',
          'Check it again later.', 'public_evidence_only',
          '2026-08-30T12:00:00.000Z', '2026-08-30T12:00:00.000Z', 0, 999
        );
      `,
    );
    const duplicateDraft = spawnSync('sqlite3', [database], {
      input: `
        INSERT INTO outcomes (
          id, repair_id, title, activity, observed_effect, evidence,
          confidence, verifier_name, who_benefited, what_did_not_change,
          learning, source_mode, created_at, updated_at, is_published, sort_order
        ) SELECT
          'third_draft', repair_id, title, activity, observed_effect, evidence,
          confidence, verifier_name, who_benefited, what_did_not_change,
          learning, source_mode, created_at, updated_at, 0, sort_order
        FROM outcomes WHERE id = 'second_draft';
      `,
      encoding: 'utf8',
    });
    assert.notEqual(duplicateDraft.status, 0);
    assert.match(duplicateDraft.stderr, /unique constraint/i);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

void test('publication compare-and-set checks the real job and update parent', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cfj-publication-cas-'));
  const database = join(directory, 'test.sqlite');
  try {
    applySql(database, migrationSql(migrationNames));
    applySql(
      database,
      `
        INSERT INTO repairs (
          id, slug, title, summary, stage, scope, affected_groups,
          known_facts, unknowns, disputed_claims, desired_change,
          smallest_test, safeguards, owner_name, partner_name, review_date,
          updated_at, is_demo, is_published
        ) VALUES (
          'cas_repair', 'cas-repair', 'Compare and set repair',
          'A complete invented summary for the publication lock test.',
          'framing', 'One invented service.', 'Invented affected people.',
          'One invented fact.', 'One invented unknown.', 'No dispute.',
          'The invented path becomes fairer.', 'Try one invented check.',
          'Use no real details and stop on any risk.', 'Owner', 'Checker',
          '2099-12-31', '2026-08-30T12:00:00.000Z', 0, 0
        );
        INSERT INTO action_cards (
          id, repair_id, title, intended_output, why_it_matters, time_size,
          compensation, participation_mode, response_questions, response_path,
          is_preview, skills_needed, location_mode, owner_name, reviewer_name,
          capacity, status, evidence_required, review_date, stop_condition,
          sort_order
        ) VALUES (
          'cas_action', 'cas_repair', 'Check one invented step',
          'One invented checked note.', 'It checks the smallest change.',
          '20 minutes', 'Paid invented rehearsal.', 'offer', '[]', NULL, 0,
          'Careful reading', 'Remote', 'Owner', 'Checker', 1, 'verified',
          'One invented checked note.', '2099-12-31',
          'Stop after one invented check.', 1
        );
      `,
    );
    const revision = Number(
      execFileSync('sqlite3', [database], {
        input: `SELECT publication_revision FROM repairs WHERE id = 'cas_repair';`,
      })
        .toString()
        .trim(),
    );
    const wrongStatus = execFileSync('sqlite3', [database], {
      input: `
        ${bindNumberedSql(PUBLISH_REPAIR_DRAFT_SQL, [
          '2026-08-30T12:01:00.000Z',
          `v1:sha256:${'a'.repeat(64)}`,
          'cas_repair',
          revision,
          'cas_action',
        ])}
        SELECT changes();
        SELECT is_published || '|' || (published_snapshot_hash IS NULL)
          FROM repairs WHERE id = 'cas_repair';
      `,
    })
      .toString()
      .trim()
      .split('\n');
    assert.deepEqual(wrongStatus, ['0', '0|1']);

    applySql(
      database,
      `
        INSERT INTO repairs (
          id, slug, title, summary, stage, scope, affected_groups,
          known_facts, unknowns, disputed_claims, desired_change,
          smallest_test, safeguards, owner_name, partner_name, review_date,
          updated_at, is_demo, is_published
        ) VALUES (
          'update_parent', 'update-parent', 'Update parent',
          'A public invented parent for the update lock test.', 'acting',
          'One service.', 'Invented people.', 'One fact.', 'One unknown.',
          'No dispute.', 'A fairer path.', 'One small test.',
          'Use no real details.', 'Owner', 'Checker', '2099-12-31',
          '2026-08-30T12:00:00.000Z', 0, 1
        );
        INSERT INTO repair_updates (
          id, repair_id, title, body, evidence_changed, remains_unfair,
          next_owner, next_review_date, published_at, is_published
        ) VALUES (
          'cas_update', 'update_parent', 'Private update',
          'An invented update that must stay private.', 'One invented change.',
          'One part remains unfair.', 'Owner', '2099-11-30',
          '2026-08-30T12:00:00.000Z', 0
        );
        UPDATE repairs SET is_published = 0 WHERE id = 'update_parent';
      `,
    );
    const updateRevision = Number(
      execFileSync('sqlite3', [database], {
        input: `SELECT publication_revision FROM repair_updates WHERE id = 'cas_update';`,
      })
        .toString()
        .trim(),
    );
    const updateHash = `v1:sha256:${'b'.repeat(64)}`;
    const invalidParent = execFileSync('sqlite3', [database], {
      input: `
        ${bindNumberedSql(PUBLISH_REPAIR_UPDATE_DRAFT_SQL, [
          '2026-08-30T12:02:00.000Z',
          updateHash,
          'cas_update',
          updateRevision,
        ])}
        ${bindNumberedSql(APPLY_PUBLISHED_UPDATE_TO_REPAIR_SQL, [
          '2099-11-30',
          '2026-08-30T12:02:00.000Z',
          'cas_update',
          updateRevision,
          updateHash,
        ])}
        SELECT is_published || '|' || (published_snapshot_hash IS NULL)
          FROM repair_updates WHERE id = 'cas_update';
        SELECT review_date FROM repairs WHERE id = 'update_parent';
      `,
    })
      .toString()
      .trim()
      .split('\n');
    assert.deepEqual(invalidParent, ['0|1', '2099-12-31']);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

void test('selected replies invalidate review and their full words are immutable', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cfj-outcome-consent-'));
  const database = join(directory, 'test.sqlite');
  try {
    applySql(database, migrationSql(migrationNames));
    applySql(
      database,
      `
        INSERT INTO action_invites (
          id, action_id, token_hash, expires_at, created_at
        ) VALUES (
          'source_invite', 'CFJ-A004', '${'c'.repeat(64)}',
          '2099-12-31T23:59:59.000Z', '2026-08-30T12:00:00.000Z'
        );
        INSERT INTO action_responses (
          id, action_id, invite_id, questions, answers,
          consent_private_use, consent_anonymous_summary, confirmed_adult,
          status, delete_after, created_at, updated_at
        ) VALUES (
          'source_response', 'CFJ-A004', 'source_invite',
          '["Made-up question"]', '["Made-up private answer"]',
          1, 1, 1, 'reviewed', '2099-12-31T23:59:59.000Z',
          '2026-08-30T12:00:00.000Z', '2026-08-30T12:00:00.000Z'
        );
        INSERT INTO outcomes (
          id, repair_id, title, activity, observed_effect, evidence,
          confidence, verifier_name, who_benefited, what_did_not_change,
          learning, source_mode, created_at, updated_at, is_published, sort_order
        ) VALUES (
          'reply_draft', 'CFJ-R002', 'Reply-backed private result',
          'We ran one small and bounded private check.',
          'One part of the page was easier to understand.',
          'The checked nameless summary records the small result.',
          'observed', 'Test checker', 'People using the test page.',
          'No wider service changed.', 'Run another bounded check later.',
          'consented_replies', '2026-08-30T12:00:00.000Z',
          '2026-08-30T12:00:00.000Z', 0, 999
        );
        INSERT INTO outcome_response_sources (
          outcome_id, response_id, selected_at
        ) VALUES (
          'reply_draft', 'source_response', '2026-08-30T12:00:00.000Z'
        );
        UPDATE outcomes SET
          reviewed_revision = publication_revision,
          reviewed_snapshot_hash = 'v1:sha256:${'d'.repeat(64)}',
          consent_checked_at = '2026-08-30T12:00:00.000Z'
        WHERE id = 'reply_draft';
        UPDATE action_responses SET
          status = 'rejected', updated_at = '2026-08-30T12:01:00.000Z'
        WHERE id = 'source_response';
      `,
    );
    const invalidated = execFileSync('sqlite3', [database], {
      input: `
        SELECT publication_revision || '|' ||
          (reviewed_revision IS NULL) || '|' ||
          (reviewed_snapshot_hash IS NULL) || '|' ||
          (consent_checked_at IS NULL)
        FROM outcomes WHERE id = 'reply_draft';
      `,
    })
      .toString()
      .trim();
    assert.equal(invalidated, '3|1|1|1');

    const rewriteSource = spawnSync('sqlite3', [database], {
      input: `
        UPDATE outcome_response_sources SET response_id = 'source_response'
        WHERE outcome_id = 'reply_draft';
      `,
      encoding: 'utf8',
    });
    assert.notEqual(rewriteSource.status, 0);
    assert.match(rewriteSource.stderr, /replace outcome sources/i);

    const rewriteReply = spawnSync('sqlite3', [database], {
      input: `
        UPDATE action_responses SET answers = '["Changed private answer"]'
        WHERE id = 'source_response';
      `,
      encoding: 'utf8',
    });
    assert.notEqual(rewriteReply.status, 0);
    assert.match(rewriteReply.stderr, /cannot be edited/i);

    applySql(
      database,
      `DELETE FROM action_responses WHERE id = 'source_response';`,
    );
    const deleted = execFileSync('sqlite3', [database], {
      input: `
        SELECT COUNT(*) FROM outcome_response_sources
          WHERE outcome_id = 'reply_draft';
        SELECT publication_revision FROM outcomes WHERE id = 'reply_draft';
      `,
    })
      .toString()
      .trim()
      .split('\n');
    assert.deepEqual(deleted, ['0', '4']);

    const directPublicInsert = spawnSync('sqlite3', [database], {
      input: `
        INSERT INTO outcomes (
          id, repair_id, title, activity, observed_effect, evidence,
          confidence, verifier_name, who_benefited, what_did_not_change,
          learning, source_mode, created_at, updated_at, published_at,
          is_published, sort_order
        ) SELECT
          'bad_public_insert', repair_id, title, activity, observed_effect,
          evidence, confidence, verifier_name, who_benefited,
          what_did_not_change, learning, source_mode, created_at, updated_at,
          updated_at, 1, sort_order
        FROM outcomes WHERE id = 'reply_draft';
      `,
      encoding: 'utf8',
    });
    assert.notEqual(directPublicInsert.status, 0);
    assert.match(directPublicInsert.stderr, /private draft/i);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
