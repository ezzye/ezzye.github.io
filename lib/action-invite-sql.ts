export const RESERVE_ACTION_INVITE_SQL = `INSERT INTO action_invites (
  id, action_id, token_hash, expires_at, created_at
)
SELECT ?1, a.id, ?2, ?3, ?4
FROM action_cards a
JOIN repairs r ON r.id = a.repair_id
WHERE a.id = ?5 AND r.is_published = 1 AND r.is_demo = 0
  AND r.stage NOT IN ('closed', 'stopped')
  AND a.participation_mode = 'direct_response'
  AND a.response_path IS NOT NULL
  AND a.compensation = ?6 AND a.reviewer_name = ?7 AND a.review_date = ?8
  AND a.pilot_terms_approved_at = ?9
  AND a.pilot_approval_snapshot = ?10
  AND a.status IN ('ready', 'offered')
  AND datetime(?11) > datetime('now')
  AND (
    SELECT COUNT(*) FROM action_responses ar
    WHERE ar.action_id = a.id AND ar.status != 'rejected'
  ) + (
    SELECT COUNT(*) FROM action_invites ai
    WHERE ai.action_id = a.id
      AND ai.used_at IS NULL AND ai.revoked_at IS NULL
      AND datetime(ai.expires_at) > datetime('now')
      AND NOT EXISTS (
        SELECT 1 FROM action_responses ar WHERE ar.invite_id = ai.id
      )
  ) < a.capacity`;
