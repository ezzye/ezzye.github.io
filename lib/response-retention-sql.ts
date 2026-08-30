export const DUE_ACTION_RESPONSE_PREDICATE = `delete_after IS NULL
  OR datetime(delete_after) IS NULL
  OR datetime(delete_after) <= datetime(?1)
  OR (?2 IS NOT NULL AND datetime(?2) <= datetime(?1))`;

export const STOP_DUE_RESPONSE_ACTIONS_SQL = `UPDATE action_cards
SET status = 'stopped', is_preview = 1,
  pilot_terms_approved_at = NULL, pilot_approval_snapshot = NULL
WHERE id IN (
  SELECT action_id FROM action_responses
  WHERE ${DUE_ACTION_RESPONSE_PREDICATE}
)`;

export const REVOKE_DUE_RESPONSE_INVITES_SQL = `UPDATE action_invites
SET revoked_at = COALESCE(revoked_at, ?1)
WHERE action_id IN (
  SELECT action_id FROM action_responses
  WHERE ${DUE_ACTION_RESPONSE_PREDICATE}
)`;

export const DELETE_DUE_ACTION_RESPONSES_SQL = `DELETE FROM action_responses
WHERE ${DUE_ACTION_RESPONSE_PREDICATE}`;

export const DELETE_EXPIRED_ACTION_INVITES_SQL = `DELETE FROM action_invites
WHERE datetime(expires_at) <= datetime(?1)
  AND NOT EXISTS (
    SELECT 1 FROM action_responses ar
    WHERE ar.invite_id = action_invites.id
  )`;

export const DELETE_EXPIRED_RATE_LIMITS_SQL = `DELETE FROM rate_limits
WHERE reset_at < ?1`;
