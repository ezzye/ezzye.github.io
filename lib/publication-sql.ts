export const PUBLISH_REPAIR_DRAFT_SQL = `UPDATE repairs
SET is_published = 1, stage = 'acting', updated_at = ?1,
  published_snapshot_hash = ?2
WHERE id = ?3 AND is_demo = 0 AND is_published = 0
  AND publication_revision = ?4 AND published_snapshot_hash IS NULL
  AND (
    SELECT COUNT(*) FROM action_cards a
    WHERE a.repair_id = repairs.id
  ) = 1
  AND EXISTS (
    SELECT 1 FROM action_cards a
    WHERE a.id = ?5 AND a.repair_id = repairs.id
      AND a.participation_mode = 'offer'
      AND a.status = 'stopped' AND a.is_preview = 0
      AND a.response_path IS NULL AND a.response_questions = '[]'
  )`;

export const PUBLISH_REPAIR_UPDATE_DRAFT_SQL = `UPDATE repair_updates
SET is_published = 1, published_at = ?1, published_snapshot_hash = ?2
WHERE id = ?3 AND is_published = 0
  AND publication_revision = ?4 AND published_snapshot_hash IS NULL
  AND EXISTS (
    SELECT 1 FROM repairs r
    WHERE r.id = repair_updates.repair_id
      AND r.is_published = 1 AND r.is_demo = 0
  )`;

export const APPLY_PUBLISHED_UPDATE_TO_REPAIR_SQL = `UPDATE repairs
SET review_date = ?1, updated_at = ?2
WHERE changes() = 1
  AND id = (
    SELECT repair_id FROM repair_updates
    WHERE id = ?3 AND is_published = 1
      AND publication_revision = ?4 AND published_snapshot_hash = ?5
  )
  AND is_published = 1 AND is_demo = 0`;
