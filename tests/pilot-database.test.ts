import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { RESERVE_ACTION_INVITE_SQL } from '../lib/action-invite-sql.ts';
import {
  DELETE_DUE_ACTION_RESPONSES_SQL,
  REVOKE_DUE_RESPONSE_INVITES_SQL,
  STOP_DUE_RESPONSE_ACTIONS_SQL,
} from '../lib/response-retention-sql.ts';

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
