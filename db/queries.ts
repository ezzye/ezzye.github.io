import { env } from 'cloudflare:workers';

import { demoBundle } from '@/lib/demo-data';
import { repairCanPublish, slugFromTitle } from '@/lib/admin-content';
import { publicEvidenceUrlIsSafe } from '@/lib/outcome-draft-input';
import {
  createActionInviteToken,
  hashActionInviteToken,
} from '@/lib/action-invites';
import { RESERVE_ACTION_INVITE_SQL } from '@/lib/action-invite-sql';
import {
  pilotClosingDateIsAllowed,
  pilotClosingInstant,
} from '@/lib/pilot-rules';
import {
  DELETE_EXPIRED_ACTION_INVITES_SQL,
  DELETE_EXPIRED_RATE_LIMITS_SQL,
  DELETE_DUE_ACTION_RESPONSES_SQL,
  DUE_ACTION_RESPONSE_PREDICATE,
  REVOKE_DUE_RESPONSE_INVITES_SQL,
  STOP_DUE_RESPONSE_ACTIONS_SQL,
} from '@/lib/response-retention-sql';
import {
  getPilotPrivacyConfiguration,
  type PilotApprovalTerms,
} from '@/lib/public-intake';
import {
  outcomeDraftPublicationSnapshot,
  outcomePublishedSnapshot,
  publicationSnapshotHash,
  repairPublicationSnapshot,
  repairUpdatePublicationSnapshot,
} from '@/lib/publication-snapshot';
import {
  APPLY_PUBLISHED_UPDATE_TO_REPAIR_SQL,
  PUBLISH_REPAIR_DRAFT_SQL,
  PUBLISH_REPAIR_UPDATE_DRAFT_SQL,
} from '@/lib/publication-sql';
import type {
  ActionCard,
  ActionOfferInput,
  AdminActionInvite,
  AdminActionResponse,
  AdminAppeal,
  AdminOutcome,
  AdminProposal,
  AdminRepair,
  AdminRepairBundle,
  AdminRepairUpdate,
  AdminRetentionEvent,
  AdminRetentionSweep,
  AppealInput,
  Correction,
  Outcome,
  OutcomeConfidence,
  OutcomeSourceMode,
  PublicationGuard,
  ProposalInput,
  Repair,
  RepairBundle,
  RepairUpdate,
  StewardBrief,
} from '@/lib/types';

type RepairRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  stage: Repair['stage'];
  scope: string;
  affected_groups: string;
  known_facts: string;
  unknowns: string;
  disputed_claims: string;
  desired_change: string;
  smallest_test: string;
  safeguards: string;
  owner_name: string;
  partner_name: string | null;
  review_date: string;
  updated_at: string;
  is_demo: number;
};

type AdminRepairRow = RepairRow & {
  is_published: number;
  publication_revision: number;
  published_snapshot_hash: string | null;
};

type ActionRow = {
  id: string;
  repair_id: string;
  title: string;
  intended_output: string;
  why_it_matters: string;
  time_size: string;
  compensation: string;
  participation_mode: ActionCard['participationMode'];
  response_questions: string;
  response_path: string | null;
  is_preview: number;
  skills_needed: string;
  location_mode: string;
  owner_name: string;
  reviewer_name: string;
  pilot_terms_approved_at: string | null;
  pilot_approval_snapshot: string | null;
  capacity: number;
  status: ActionCard['status'];
  evidence_required: string;
  review_date: string;
  stop_condition: string;
  sort_order: number;
};

type OutcomeRow = {
  id: string;
  repair_id: string;
  repair_slug?: string;
  repair_title?: string;
  repair_is_demo?: number;
  title: string;
  activity: string;
  observed_effect: string;
  evidence: string;
  evidence_url: string | null;
  confidence: OutcomeConfidence;
  verifier_name: string;
  who_benefited: string;
  what_did_not_change: string;
  learning: string;
  source_mode: OutcomeSourceMode;
  source_reply_count: number;
  published_at: string;
  sort_order: number;
};

type AdminOutcomeRow = Omit<OutcomeRow, 'published_at'> & {
  published_at: string | null;
  is_published: number;
  source_mode: OutcomeSourceMode;
  source_reply_count: number;
  publication_revision: number;
  reviewed_revision: number | null;
  reviewed_snapshot_hash: string | null;
  published_snapshot_hash: string | null;
  consent_checked_at: string | null;
};

type OutcomeSourceRow = {
  outcome_id: string;
  response_id: string;
};

type UpdateRow = {
  id: string;
  repair_id: string;
  title: string;
  body: string;
  evidence_changed: string;
  remains_unfair: string;
  next_owner: string;
  next_review_date: string;
  published_at: string;
};

type AdminUpdateRow = UpdateRow & {
  is_published: number;
  publication_revision: number;
  published_snapshot_hash: string | null;
};

type AdminActionResponseRow = {
  id: string;
  action_id: string;
  action_title: string;
  questions: string;
  answers: string;
  consent_private_use: number;
  consent_anonymous_summary: number;
  confirmed_adult: number;
  status: AdminActionResponse['status'];
  delete_after: string;
  created_at: string;
};

type RetentionEventRow = {
  id: string;
  data_type: string;
  trigger: AdminRetentionEvent['trigger'];
  due_date: string;
  records_deleted: number;
  completed_at: string;
};

type RetentionSweepRow = {
  last_started_at: string | null;
  last_completed_at: string | null;
  last_records_deleted: number;
  run_count: number;
  last_error_at: string | null;
};

type AdminActionInviteRow = {
  id: string;
  action_id: string;
  action_title: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  is_expired: number;
};

function parseStringList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

type CorrectionRow = {
  id: string;
  item_reference: string;
  summary: string;
  changed_at: string;
};

type StewardRow = {
  id: string;
  repair_id: string;
  source_checksum: string;
  summary: string;
  next_action: string;
  blockers: string;
  draft_update: string;
  questions: string;
  model: string;
  status: StewardBrief['status'];
  generated_at: string;
  reviewed_at: string | null;
};

function mapRepair(row: RepairRow): Repair {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    stage: row.stage,
    scope: row.scope,
    affectedGroups: row.affected_groups,
    knownFacts: row.known_facts,
    unknowns: row.unknowns,
    disputedClaims: row.disputed_claims,
    desiredChange: row.desired_change,
    smallestTest: row.smallest_test,
    safeguards: row.safeguards,
    ownerName: row.owner_name,
    partnerName: row.partner_name,
    reviewDate: row.review_date,
    updatedAt: row.updated_at,
    isDemo: Boolean(row.is_demo),
  };
}

function mapAdminRepair(
  row: AdminRepairRow,
  publicationGuard: PublicationGuard | null,
): AdminRepair {
  return {
    ...mapRepair(row),
    isPublished: Boolean(row.is_published),
    publicationGuard,
  };
}

function mapAction(row: ActionRow): ActionCard {
  return {
    id: row.id,
    repairId: row.repair_id,
    title: row.title,
    intendedOutput: row.intended_output,
    whyItMatters: row.why_it_matters,
    timeSize: row.time_size,
    compensation: row.compensation,
    participationMode: row.participation_mode,
    responseQuestions: parseStringList(row.response_questions),
    responsePath: row.response_path,
    isPreview: Boolean(row.is_preview),
    skillsNeeded: row.skills_needed,
    locationMode: row.location_mode,
    ownerName: row.owner_name,
    reviewerName: row.reviewer_name,
    pilotTermsApprovedAt: row.pilot_terms_approved_at,
    pilotApprovalSnapshot: row.pilot_approval_snapshot,
    capacity: row.capacity,
    status: row.status,
    evidenceRequired: row.evidence_required,
    reviewDate: row.review_date,
    stopCondition: row.stop_condition,
    sortOrder: row.sort_order,
  };
}

function mapOutcome(row: OutcomeRow): Outcome {
  return {
    id: row.id,
    repairId: row.repair_id,
    repairSlug: row.repair_slug,
    repairTitle: row.repair_title,
    repairIsDemo:
      row.repair_is_demo === undefined
        ? undefined
        : Boolean(row.repair_is_demo),
    title: row.title,
    activity: row.activity,
    observedEffect: row.observed_effect,
    evidence: row.evidence,
    evidenceUrl: row.evidence_url,
    confidence: row.confidence,
    verifierName: row.verifier_name,
    whoBenefited: row.who_benefited,
    whatDidNotChange: row.what_did_not_change,
    learning: row.learning,
    sourceMode: row.source_mode,
    sourceReplyCount: Number(row.source_reply_count),
    publishedAt: row.published_at,
    sortOrder: row.sort_order,
  };
}

async function mapAdminOutcome(
  row: AdminOutcomeRow,
  selectedResponseIds: string[],
): Promise<AdminOutcome> {
  const outcome: AdminOutcome = {
    id: row.id,
    repairId: row.repair_id,
    title: row.title,
    activity: row.activity,
    observedEffect: row.observed_effect,
    evidence: row.evidence,
    evidenceUrl: row.evidence_url,
    confidence: row.confidence,
    verifierName: row.verifier_name,
    whoBenefited: row.who_benefited,
    whatDidNotChange: row.what_did_not_change,
    learning: row.learning,
    publishedAt: row.published_at,
    sortOrder: row.sort_order,
    isPublished: Boolean(row.is_published),
    sourceMode: row.source_mode,
    sourceReplyCount: Number(row.source_reply_count),
    selectedResponseIds,
    publicationGuard: null,
    reviewedGuard:
      row.reviewed_revision && row.reviewed_snapshot_hash
        ? {
            revision: row.reviewed_revision,
            snapshotHash: row.reviewed_snapshot_hash,
          }
        : null,
    consentCheckedAt: row.consent_checked_at,
  };
  if (!outcome.isPublished) {
    outcome.publicationGuard = {
      revision: row.publication_revision,
      snapshotHash: await publicationSnapshotHash(
        outcomeDraftPublicationSnapshot(outcome, selectedResponseIds),
      ),
    };
  }
  return outcome;
}

function mapUpdate(row: UpdateRow): RepairUpdate {
  return {
    id: row.id,
    repairId: row.repair_id,
    title: row.title,
    body: row.body,
    evidenceChanged: row.evidence_changed,
    remainsUnfair: row.remains_unfair,
    nextOwner: row.next_owner,
    nextReviewDate: row.next_review_date,
    publishedAt: row.published_at,
  };
}

async function mapAdminUpdate(row: AdminUpdateRow): Promise<AdminRepairUpdate> {
  const update: AdminRepairUpdate = {
    ...mapUpdate(row),
    isPublished: Boolean(row.is_published),
    publicationGuard: null,
  };
  if (!update.isPublished) {
    update.publicationGuard = {
      revision: row.publication_revision,
      snapshotHash: await publicationSnapshotHash(
        repairUpdatePublicationSnapshot(update),
      ),
    };
  }
  return update;
}

function mapStewardBrief(row: StewardRow): StewardBrief {
  return {
    id: row.id,
    repairId: row.repair_id,
    sourceChecksum: row.source_checksum,
    summary: row.summary,
    nextAction: row.next_action,
    blockers: JSON.parse(row.blockers) as string[],
    draftUpdate: row.draft_update,
    questions: JSON.parse(row.questions) as string[],
    model: row.model,
    status: row.status,
    generatedAt: row.generated_at,
    reviewedAt: row.reviewed_at,
  };
}

function databaseError(label: string, error: unknown) {
  console.error(`Coding for Justice database fallback: ${label}`, error);
}

export async function getPublicRepairs(): Promise<Repair[]> {
  try {
    const result = await env.DB.prepare(
      `SELECT id, slug, title, summary, stage, scope, affected_groups,
        known_facts, unknowns, disputed_claims, desired_change, smallest_test,
        safeguards, owner_name, partner_name, review_date, updated_at, is_demo
      FROM repairs
      WHERE is_published = 1
      ORDER BY CASE stage
        WHEN 'acting' THEN 1 WHEN 'checking' THEN 2 WHEN 'framing' THEN 3
        WHEN 'listening' THEN 4 WHEN 'closed' THEN 5 ELSE 6 END,
        updated_at DESC`,
    ).all<RepairRow>();

    if (result.results.length > 0) return result.results.map(mapRepair);
  } catch (error) {
    databaseError('public repairs', error);
  }
  return [demoBundle.repair];
}

export async function getPublicRepairBundle(
  slug: string,
): Promise<RepairBundle | null> {
  try {
    await purgeDueActionResponses();
    const row = await env.DB.prepare(
      `SELECT id, slug, title, summary, stage, scope, affected_groups,
        known_facts, unknowns, disputed_claims, desired_change, smallest_test,
        safeguards, owner_name, partner_name, review_date, updated_at, is_demo
      FROM repairs WHERE slug = ? AND is_published = 1`,
    )
      .bind(slug)
      .first<RepairRow>();

    if (!row) return slug === demoBundle.repair.slug ? demoBundle : null;

    const [actions, outcomeRows, updateRows] = await Promise.all([
      env.DB.prepare(
        `SELECT id, repair_id, title, intended_output, why_it_matters,
          time_size, compensation, participation_mode, response_questions,
          response_path, is_preview,
          skills_needed, location_mode, owner_name, reviewer_name,
          pilot_terms_approved_at, pilot_approval_snapshot,
          capacity,
          CASE
            WHEN date(review_date) < date('now')
              AND status IN ('ready', 'offered') THEN 'stopped'
            ELSE status
          END AS status,
          evidence_required, review_date, stop_condition,
          sort_order
        FROM action_cards WHERE repair_id = ? ORDER BY sort_order, id`,
      )
        .bind(row.id)
        .all<ActionRow>(),
      env.DB.prepare(
        `SELECT id, repair_id, title, activity, observed_effect, evidence,
          evidence_url, confidence, verifier_name, who_benefited,
          what_did_not_change, learning, source_mode, source_reply_count,
          published_at, sort_order
        FROM outcomes
        WHERE repair_id = ? AND is_published = 1
          AND source_mode = 'public_evidence_only'
        ORDER BY sort_order, published_at DESC`,
      )
        .bind(row.id)
        .all<OutcomeRow>(),
      env.DB.prepare(
        `SELECT id, repair_id, title, body, evidence_changed, remains_unfair,
          next_owner, next_review_date, published_at
        FROM repair_updates
        WHERE repair_id = ? AND is_published = 1
        ORDER BY published_at DESC`,
      )
        .bind(row.id)
        .all<UpdateRow>(),
    ]);

    return {
      repair: mapRepair(row),
      actions: actions.results.map(mapAction),
      outcomes: outcomeRows.results.map(mapOutcome),
      updates: updateRows.results.map(mapUpdate),
    };
  } catch (error) {
    databaseError(`repair ${slug}`, error);
    return slug === demoBundle.repair.slug ? demoBundle : null;
  }
}

export async function getCurrentRepairBundle(): Promise<RepairBundle> {
  try {
    const row = await env.DB.prepare(
      `SELECT slug FROM repairs
       WHERE is_published = 1 AND is_demo = 0
       ORDER BY updated_at DESC LIMIT 1`,
    ).first<{ slug: string }>();
    if (row) {
      return (await getPublicRepairBundle(row.slug)) ?? demoBundle;
    }
  } catch (error) {
    databaseError('current real repair', error);
  }
  const repairs = await getPublicRepairs();
  return (
    (await getPublicRepairBundle(repairs[0]?.slug ?? demoBundle.repair.slug)) ??
    demoBundle
  );
}

function demoAdminBundle(): AdminRepairBundle {
  return {
    repair: {
      ...demoBundle.repair,
      isPublished: true,
      publicationGuard: null,
    },
    actions: demoBundle.actions,
    outcomes: demoBundle.outcomes.map((outcome) => ({
      ...outcome,
      isPublished: true,
      sourceMode: 'public_evidence_only' as const,
      sourceReplyCount: 0,
      selectedResponseIds: [],
      publicationGuard: null,
      reviewedGuard: null,
      consentCheckedAt: null,
    })),
    updates: demoBundle.updates.map((update) => ({
      ...update,
      isPublished: true,
      publicationGuard: null,
    })),
  };
}

export async function getAdminRepairBundle(
  repairId: string,
): Promise<AdminRepairBundle | null> {
  const row = await env.DB.prepare(
    `SELECT id, slug, title, summary, stage, scope, affected_groups,
      known_facts, unknowns, disputed_claims, desired_change, smallest_test,
      safeguards, owner_name, partner_name, review_date, updated_at, is_demo,
      is_published, publication_revision, published_snapshot_hash
     FROM repairs WHERE id = ? AND is_demo = 0`,
  )
    .bind(repairId)
    .first<AdminRepairRow>();
  if (!row) return null;

  const [actions, outcomeRows, outcomeSources, updateRows] = await Promise.all([
    env.DB.prepare(
      `SELECT id, repair_id, title, intended_output, why_it_matters,
        time_size, compensation, participation_mode, response_questions,
        response_path, is_preview, skills_needed, location_mode, owner_name,
        reviewer_name, pilot_terms_approved_at, pilot_approval_snapshot,
        capacity, status, evidence_required, review_date, stop_condition,
        sort_order
       FROM action_cards WHERE repair_id = ? ORDER BY sort_order, id`,
    )
      .bind(row.id)
      .all<ActionRow>(),
    env.DB.prepare(
      `SELECT id, repair_id, title, activity, observed_effect, evidence,
        evidence_url, confidence, verifier_name, who_benefited,
        what_did_not_change, learning, source_mode, source_reply_count,
        publication_revision, reviewed_revision, reviewed_snapshot_hash,
        published_snapshot_hash, consent_checked_at, published_at,
        is_published, sort_order
       FROM outcomes WHERE repair_id = ? ORDER BY sort_order, published_at DESC`,
    )
      .bind(row.id)
      .all<AdminOutcomeRow>(),
    env.DB.prepare(
      `SELECT outcome_id, response_id FROM outcome_response_sources
       WHERE outcome_id IN (SELECT id FROM outcomes WHERE repair_id = ?)
       ORDER BY response_id`,
    )
      .bind(row.id)
      .all<OutcomeSourceRow>(),
    env.DB.prepare(
      `SELECT id, repair_id, title, body, evidence_changed, remains_unfair,
        next_owner, next_review_date, published_at, is_published,
        publication_revision, published_snapshot_hash
       FROM repair_updates WHERE repair_id = ? ORDER BY published_at DESC`,
    )
      .bind(row.id)
      .all<AdminUpdateRow>(),
  ]);

  const mappedActions = actions.results.map(mapAction);
  const repairGuard =
    !row.is_published && mappedActions.length === 1
      ? {
          revision: row.publication_revision,
          snapshotHash: await publicationSnapshotHash(
            repairPublicationSnapshot(mapRepair(row), mappedActions[0]),
          ),
        }
      : null;
  const sourceIdsByOutcome = new Map<string, string[]>();
  for (const source of outcomeSources.results) {
    const ids = sourceIdsByOutcome.get(source.outcome_id) ?? [];
    ids.push(source.response_id);
    sourceIdsByOutcome.set(source.outcome_id, ids);
  }

  return {
    repair: mapAdminRepair(row, repairGuard),
    actions: mappedActions,
    outcomes: await Promise.all(
      outcomeRows.results.map((outcome) =>
        mapAdminOutcome(outcome, sourceIdsByOutcome.get(outcome.id) ?? []),
      ),
    ),
    updates: await Promise.all(updateRows.results.map(mapAdminUpdate)),
  };
}

export async function getAdminWorkBundle(): Promise<AdminRepairBundle> {
  try {
    const row = await env.DB.prepare(
      `SELECT id FROM repairs
       WHERE is_demo = 0
       ORDER BY CASE
         WHEN is_published = 1 AND EXISTS (
           SELECT 1 FROM action_cards a
           WHERE a.repair_id = repairs.id
             AND a.participation_mode = 'direct_response'
             AND (
               a.is_preview = 0
               OR EXISTS (
                 SELECT 1 FROM action_responses ar WHERE ar.action_id = a.id
               )
               OR EXISTS (
                 SELECT 1 FROM action_invites ai
                 WHERE ai.action_id = a.id AND ai.used_at IS NULL
                   AND ai.revoked_at IS NULL
                   AND datetime(ai.expires_at) > datetime('now')
               )
             )
         ) THEN 0
         WHEN is_published = 1 AND stage NOT IN ('closed', 'stopped') THEN 1
         WHEN is_published = 0 THEN 2
         ELSE 3
       END, updated_at DESC
       LIMIT 1`,
    ).first<{ id: string }>();
    if (row) return (await getAdminRepairBundle(row.id)) ?? demoAdminBundle();
  } catch (error) {
    databaseError('admin work bundle', error);
  }
  return demoAdminBundle();
}

export async function getHomeRepairBundle(): Promise<RepairBundle> {
  try {
    await purgeDueActionResponses();
    const row = await env.DB.prepare(
      `SELECT r.slug
       FROM repairs r
       WHERE r.is_published = 1 AND r.is_demo = 0
         AND r.stage NOT IN ('closed', 'stopped')
         AND EXISTS (
           SELECT 1 FROM action_cards a
           WHERE a.repair_id = r.id
             AND a.status IN ('ready', 'offered')
             AND a.compensation != 'Pay not set — job cannot open'
             AND date(a.review_date) >= date('now')
         )
       ORDER BY r.updated_at DESC
       LIMIT 1`,
    ).first<{ slug: string }>();

    if (row) {
      return (await getPublicRepairBundle(row.slug)) ?? demoBundle;
    }
  } catch (error) {
    databaseError('home repair', error);
  }
  return demoBundle;
}

export async function getLatestOutcomes(limit = 20): Promise<Outcome[]> {
  try {
    const result = await env.DB.prepare(
      `SELECT o.id, o.repair_id, r.slug AS repair_slug, r.title AS repair_title,
        r.is_demo AS repair_is_demo,
        o.title, o.activity, o.observed_effect, o.evidence, o.evidence_url,
        o.confidence, o.verifier_name, o.who_benefited,
        o.what_did_not_change, o.learning, o.source_mode,
        o.source_reply_count, o.published_at, o.sort_order
      FROM outcomes o
      JOIN repairs r ON r.id = o.repair_id
      WHERE o.is_published = 1 AND r.is_published = 1
        AND o.source_mode = 'public_evidence_only'
      ORDER BY o.published_at DESC LIMIT ?`,
    )
      .bind(limit)
      .all<OutcomeRow>();
    if (result.results.length > 0) return result.results.map(mapOutcome);
  } catch (error) {
    databaseError('outcomes', error);
  }
  return demoBundle.outcomes;
}

export async function getPublishedCorrections(): Promise<Correction[]> {
  try {
    const result = await env.DB.prepare(
      `SELECT id, item_reference, summary, changed_at
       FROM corrections WHERE is_published = 1 ORDER BY changed_at DESC`,
    ).all<CorrectionRow>();
    return result.results.map((row) => ({
      id: row.id,
      itemReference: row.item_reference,
      summary: row.summary,
      changedAt: row.changed_at,
    }));
  } catch (error) {
    databaseError('corrections', error);
    return [];
  }
}

export async function createProposal(input: ProposalInput): Promise<string> {
  const id = `proposal_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO proposals (
      id, working_title, problem, broad_location, affected_groups,
      evidence_state, source_links, desired_change, first_step, help_needed,
      relationship, chosen_name, email, contact_preference, accessibility_need,
      privacy_concern, consent_contact, consent_redacted_draft, background_only,
      consent_credit, consent_ai, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
  )
    .bind(
      id,
      input.workingTitle,
      input.problem,
      input.broadLocation,
      input.affectedGroups,
      input.evidenceState,
      input.sourceLinks,
      input.desiredChange,
      input.firstStep,
      input.helpNeeded,
      input.relationship,
      input.chosenName,
      input.email,
      input.contactPreference,
      input.accessibilityNeed,
      input.privacyConcern,
      input.consentContact ? 1 : 0,
      input.consentRedactedDraft ? 1 : 0,
      input.backgroundOnly ? 1 : 0,
      input.consentCredit ? 1 : 0,
      input.consentAi ? 1 : 0,
      now,
      now,
    )
    .run();
  return id;
}

export async function createActionOffer(
  input: ActionOfferInput,
): Promise<string> {
  const action = await env.DB.prepare(
    `SELECT a.id FROM action_cards a
     JOIN repairs r ON r.id = a.repair_id
     WHERE a.id = ? AND r.is_published = 1
       AND r.is_demo = 0 AND r.stage NOT IN ('closed', 'stopped')
       AND a.participation_mode = 'offer'
       AND a.is_preview = 0
       AND a.compensation != 'Pay not set — job cannot open'
       AND date(a.review_date) >= date('now')
       AND a.status IN ('ready', 'offered')`,
  )
    .bind(input.actionId)
    .first<{ id: string }>();
  if (!action) throw new Error('Action is not available');

  const id = `offer_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO action_offers (
      id, action_id, chosen_name, email, contribution, accessibility_need,
      covenant_version, consent_contact, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
  )
    .bind(
      id,
      input.actionId,
      input.chosenName,
      input.email,
      input.contribution,
      input.accessibilityNeed,
      input.covenantVersion,
      input.consentContact ? 1 : 0,
      now,
      now,
    )
    .run();
  return id;
}

export type ActionInviteState =
  | 'valid'
  | 'used'
  | 'expired'
  | 'revoked'
  | 'invalid';

export async function getActionInviteState(
  actionId: string,
  tokenHash: string,
): Promise<ActionInviteState> {
  const row = await env.DB.prepare(
    `SELECT ai.expires_at, ai.used_at, ai.revoked_at,
      EXISTS(
        SELECT 1 FROM action_responses ar WHERE ar.invite_id = ai.id
      ) AS has_response
     FROM action_invites ai
     WHERE ai.action_id = ? AND ai.token_hash = ?`,
  )
    .bind(actionId, tokenHash)
    .first<{
      expires_at: string;
      used_at: string | null;
      revoked_at: string | null;
      has_response: number;
    }>();
  if (!row) return 'invalid';
  if (row.revoked_at) return 'revoked';
  if (row.used_at || row.has_response) return 'used';
  const expiry = new Date(row.expires_at).getTime();
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return 'expired';
  return 'valid';
}

export type PilotActionSettings = PilotApprovalTerms & {
  isPreview: boolean;
};

export async function getPilotActionSettings(
  actionId: string,
): Promise<PilotActionSettings | null> {
  const row = await env.DB.prepare(
    `SELECT title, intended_output, why_it_matters, time_size, compensation,
      response_questions, response_path, skills_needed, location_mode,
      owner_name, reviewer_name, capacity, evidence_required, review_date,
      stop_condition, pilot_terms_approved_at, pilot_approval_snapshot,
      is_preview
     FROM action_cards
     WHERE id = ? AND participation_mode = 'direct_response'`,
  )
    .bind(actionId)
    .first<{
      title: string;
      intended_output: string;
      why_it_matters: string;
      time_size: string;
      compensation: string;
      response_questions: string;
      response_path: string | null;
      skills_needed: string;
      location_mode: string;
      owner_name: string;
      reviewer_name: string;
      capacity: number;
      evidence_required: string;
      review_date: string;
      stop_condition: string;
      pilot_terms_approved_at: string | null;
      pilot_approval_snapshot: string | null;
      is_preview: number;
    }>();
  return row
    ? {
        title: row.title,
        intendedOutput: row.intended_output,
        whyItMatters: row.why_it_matters,
        timeSize: row.time_size,
        compensation: row.compensation,
        responseQuestions: parseStringList(row.response_questions),
        responsePath: row.response_path,
        skillsNeeded: row.skills_needed,
        locationMode: row.location_mode,
        ownerName: row.owner_name,
        reviewerName: row.reviewer_name,
        capacity: row.capacity,
        evidenceRequired: row.evidence_required,
        reviewDate: row.review_date,
        stopCondition: row.stop_condition,
        pilotTermsApprovedAt: row.pilot_terms_approved_at,
        pilotApprovalSnapshot: row.pilot_approval_snapshot,
        isPreview: Boolean(row.is_preview),
      }
    : null;
}

export async function createActionInvites(
  actionId: string,
  requestedCount: number,
  expected: PilotActionSettings,
): Promise<
  Array<{
    id: string;
    token: string;
    expiresAt: string;
    responsePath: string;
  }>
> {
  await purgeDueActionResponses();
  const action = await env.DB.prepare(
    `SELECT a.capacity, a.review_date, a.response_path
     FROM action_cards a
     JOIN repairs r ON r.id = a.repair_id
     WHERE a.id = ? AND r.is_published = 1 AND r.is_demo = 0
       AND r.stage NOT IN ('closed', 'stopped')
       AND a.participation_mode = 'direct_response'
       AND a.response_path IS NOT NULL
       AND a.compensation != 'Pay not set — job cannot open'
       AND a.compensation = ? AND a.reviewer_name = ? AND a.review_date = ?
       AND a.pilot_terms_approved_at = ?
       AND a.pilot_approval_snapshot = ?
       AND a.status IN ('ready', 'offered')`,
  )
    .bind(
      actionId,
      expected.compensation,
      expected.reviewerName,
      expected.reviewDate,
      expected.pilotTermsApprovedAt,
      expected.pilotApprovalSnapshot,
    )
    .first<{
      capacity: number;
      review_date: string;
      response_path: string;
    }>();
  if (!action) return [];
  const count = Math.min(Math.max(0, requestedCount), action.capacity);
  const expiresAt = pilotClosingInstant(action.review_date);
  if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) return [];
  const createdAt = new Date().toISOString();
  const created: Array<{
    id: string;
    token: string;
    expiresAt: string;
    responsePath: string;
  }> = [];

  for (let index = 0; index < count; index += 1) {
    const id = `invite_${crypto.randomUUID()}`;
    const token = createActionInviteToken();
    const tokenHash = await hashActionInviteToken(token);
    const inserted = await env.DB.prepare(RESERVE_ACTION_INVITE_SQL)
      .bind(
        id,
        tokenHash,
        expiresAt,
        createdAt,
        actionId,
        expected.compensation,
        expected.reviewerName,
        expected.reviewDate,
        expected.pilotTermsApprovedAt,
        expected.pilotApprovalSnapshot,
        expiresAt,
      )
      .run();
    if (Number(inserted.meta.changes ?? 0) !== 1) continue;
    created.push({
      id,
      token,
      expiresAt,
      responsePath: action.response_path,
    });
  }
  return created;
}

export async function getAdminActionInvites(
  repairId: string,
): Promise<AdminActionInvite[]> {
  const result = await env.DB.prepare(
    `SELECT ai.id, ai.action_id, a.title AS action_title, ai.expires_at,
      COALESCE(ai.used_at, ar.created_at) AS used_at, ai.revoked_at,
      ai.created_at,
      datetime(ai.expires_at) < datetime('now') AS is_expired
     FROM action_invites ai
     JOIN action_cards a ON a.id = ai.action_id
     LEFT JOIN action_responses ar ON ar.invite_id = ai.id
     WHERE a.repair_id = ?
     ORDER BY ai.created_at DESC`,
  )
    .bind(repairId)
    .all<AdminActionInviteRow>();
  return result.results.map((row) => ({
    id: row.id,
    actionId: row.action_id,
    actionTitle: row.action_title,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    isExpired:
      Boolean(row.is_expired) ||
      !Number.isFinite(new Date(row.expires_at).getTime()) ||
      new Date(row.expires_at).getTime() <= Date.now(),
  }));
}

export async function revokeActionInvite(id: string): Promise<boolean> {
  const result = await env.DB.prepare(
    `UPDATE action_invites SET revoked_at = ?
     WHERE id = ? AND revoked_at IS NULL AND used_at IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM action_responses ar
         WHERE ar.invite_id = action_invites.id
       )`,
  )
    .bind(new Date().toISOString(), id)
    .run();
  return Number(result.meta.changes ?? 0) === 1;
}

export async function updateActionPreview(
  id: string,
  isPreview: boolean,
): Promise<boolean> {
  await purgeDueActionResponses();
  if (isPreview) {
    const results = await env.DB.batch([
      env.DB.prepare(
        `UPDATE action_cards
         SET is_preview = 1, pilot_terms_approved_at = NULL,
           pilot_approval_snapshot = NULL
         WHERE id = ? AND participation_mode = 'direct_response'`,
      ).bind(id),
      env.DB.prepare(
        `UPDATE action_invites SET revoked_at = ?
         WHERE action_id = ? AND revoked_at IS NULL AND used_at IS NULL
           AND NOT EXISTS (
             SELECT 1 FROM action_responses ar
             WHERE ar.invite_id = action_invites.id
           )`,
      ).bind(new Date().toISOString(), id),
    ]);
    return Number(results[0]?.meta.changes ?? 0) === 1;
  }
  const result = await env.DB.prepare(
    `UPDATE action_cards SET is_preview = 0
     WHERE id = ? AND participation_mode = 'direct_response'
       AND status IN ('ready', 'offered')
       AND response_path IS NOT NULL
       AND compensation != 'Pay not set — job cannot open'
       AND pilot_terms_approved_at IS NOT NULL
       AND pilot_approval_snapshot IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM action_invites ai
         WHERE ai.action_id = action_cards.id
           AND ai.used_at IS NULL AND ai.revoked_at IS NULL
           AND datetime(ai.expires_at) > datetime('now')
           AND NOT EXISTS (
             SELECT 1 FROM action_responses ar
             WHERE ar.invite_id = ai.id
           )
       )`,
  )
    .bind(id)
    .run();
  return Number(result.meta.changes ?? 0) === 1;
}

export async function approvePilotActionTerms(
  id: string,
  approvalSnapshot: string,
): Promise<boolean> {
  await purgeDueActionResponses();
  const result = await env.DB.prepare(
    `UPDATE action_cards
     SET pilot_terms_approved_at = ?, pilot_approval_snapshot = ?
     WHERE id = ? AND participation_mode = 'direct_response'
       AND is_preview = 1
       AND compensation != 'Pay not set — job cannot open'
       AND NOT EXISTS (
         SELECT 1 FROM action_responses ar
         WHERE ar.action_id = action_cards.id
       )
       AND NOT EXISTS (
         SELECT 1 FROM action_invites ai
         WHERE ai.action_id = action_cards.id
           AND ai.used_at IS NULL AND ai.revoked_at IS NULL
           AND datetime(ai.expires_at) > datetime('now')
       )`,
  )
    .bind(new Date().toISOString(), approvalSnapshot, id)
    .run();
  return Number(result.meta.changes ?? 0) === 1;
}

export async function updatePilotActionSettings(
  id: string,
  input: {
    compensation: string;
    reviewerName: string;
    reviewDate: string;
  },
): Promise<boolean> {
  await purgeDueActionResponses();
  const now = new Date().toISOString();
  const stopCondition =
    'Stop after five replies or on the closing date shown, whichever comes first. Check the five replies. Make a replacement link only if a reply cannot be used. Stop sooner if the page breaks, a question upsets someone or anyone sends private details.';
  const results = await env.DB.batch([
    env.DB.prepare(
      `UPDATE action_cards
       SET compensation = ?, reviewer_name = ?, review_date = ?,
         stop_condition = ?,
         pilot_terms_approved_at = CASE
           WHEN compensation = ? AND reviewer_name = ? AND review_date = ?
             THEN pilot_terms_approved_at
           ELSE NULL
         END,
         pilot_approval_snapshot = CASE
           WHEN compensation = ? AND reviewer_name = ? AND review_date = ?
             THEN pilot_approval_snapshot
           ELSE NULL
         END
       WHERE id = ? AND participation_mode = 'direct_response'
         AND is_preview = 1
         AND NOT EXISTS (
           SELECT 1 FROM action_responses ar
           WHERE ar.action_id = action_cards.id
         )
         AND NOT EXISTS (
           SELECT 1 FROM action_invites ai
           WHERE ai.action_id = action_cards.id
             AND ai.used_at IS NULL AND ai.revoked_at IS NULL
             AND datetime(ai.expires_at) > datetime('now')
         )`,
    ).bind(
      input.compensation,
      input.reviewerName,
      input.reviewDate,
      stopCondition,
      input.compensation,
      input.reviewerName,
      input.reviewDate,
      input.compensation,
      input.reviewerName,
      input.reviewDate,
      id,
    ),
    env.DB.prepare(
      `UPDATE repairs SET review_date = ?, updated_at = ?
       WHERE changes() = 1 AND id = (
         SELECT repair_id FROM action_cards
         WHERE id = ? AND review_date = ? AND compensation = ?
           AND reviewer_name = ? AND is_preview = 1
       )`,
    ).bind(
      input.reviewDate,
      now,
      id,
      input.reviewDate,
      input.compensation,
      input.reviewerName,
    ),
  ]);
  return Number(results[0]?.meta.changes ?? 0) === 1;
}

export async function getDirectActionTask(actionId: string): Promise<{
  questions: string[];
  capacity: number;
  pilotTermsApprovedAt: string | null;
  reviewDate: string;
} | null> {
  const row = await env.DB.prepare(
    `SELECT a.response_questions, a.capacity, a.pilot_terms_approved_at,
      a.review_date
     FROM action_cards a
     JOIN repairs r ON r.id = a.repair_id
     WHERE a.id = ? AND r.is_published = 1 AND r.is_demo = 0
       AND r.stage NOT IN ('closed', 'stopped')
       AND a.participation_mode = 'direct_response'
       AND a.is_preview = 0 AND a.response_path IS NOT NULL
       AND a.compensation != 'Pay not set — job cannot open'
       AND a.status IN ('ready', 'offered')`,
  )
    .bind(actionId)
    .first<{
      response_questions: string;
      capacity: number;
      pilot_terms_approved_at: string | null;
      review_date: string;
    }>();
  if (!row) return null;
  return {
    questions: parseStringList(row.response_questions),
    capacity: row.capacity,
    pilotTermsApprovedAt: row.pilot_terms_approved_at,
    reviewDate: row.review_date,
  };
}

export async function createActionResponse(input: {
  actionId: string;
  inviteTokenHash: string;
  answers: string[];
  consentPrivateUse: boolean;
  consentAnonymousSummary: boolean;
  confirmedAdult: boolean;
  deleteAfter: string;
}): Promise<string | null> {
  const id = `response_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const inserted = await env.DB.prepare(
    `INSERT OR IGNORE INTO action_responses (
      id, action_id, invite_id, questions, answers, consent_private_use,
      consent_anonymous_summary, confirmed_adult, status, delete_after,
      created_at, updated_at
    )
    SELECT ?, a.id, ai.id, a.response_questions, ?, ?, ?, ?, 'new', ?, ?, ?
    FROM action_cards a
    JOIN repairs r ON r.id = a.repair_id
    JOIN action_invites ai ON ai.action_id = a.id
    WHERE a.id = ? AND r.is_published = 1 AND r.is_demo = 0
        AND r.stage NOT IN ('closed', 'stopped')
        AND a.participation_mode = 'direct_response'
        AND a.is_preview = 0 AND a.response_path IS NOT NULL
        AND a.compensation != 'Pay not set — job cannot open'
        AND a.pilot_terms_approved_at IS NOT NULL
        AND a.pilot_approval_snapshot IS NOT NULL
        AND a.status IN ('ready', 'offered')
        AND ai.token_hash = ? AND ai.used_at IS NULL
        AND ai.revoked_at IS NULL
        AND datetime(ai.expires_at) > datetime('now')
        AND NOT EXISTS (
          SELECT 1 FROM action_responses used
          WHERE used.invite_id = ai.id
        )
        AND (
          SELECT COUNT(*) FROM action_responses
          WHERE action_id = a.id AND status != 'rejected'
        ) < a.capacity`,
  )
    .bind(
      id,
      JSON.stringify(input.answers),
      input.consentPrivateUse ? 1 : 0,
      input.consentAnonymousSummary ? 1 : 0,
      input.confirmedAdult ? 1 : 0,
      input.deleteAfter,
      now,
      now,
      input.actionId,
      input.inviteTokenHash,
    )
    .run();

  if (Number(inserted.meta.changes ?? 0) !== 1) return null;

  await env.DB.prepare(
    `UPDATE action_invites SET used_at = ?
     WHERE id = (
       SELECT invite_id FROM action_responses WHERE id = ?
     ) AND used_at IS NULL`,
  )
    .bind(now, id)
    .run();

  await env.DB.prepare(
    `UPDATE action_cards SET status = 'review'
     WHERE id = ? AND capacity <= (
       SELECT COUNT(*) FROM action_responses
       WHERE action_id = ? AND status != 'rejected'
     )`,
  )
    .bind(input.actionId, input.actionId)
    .run();
  return id;
}

function mapRetentionEvent(row: RetentionEventRow): AdminRetentionEvent {
  return {
    id: row.id,
    dataType: row.data_type,
    trigger: row.trigger,
    dueDate: row.due_date,
    recordsDeleted: Number(row.records_deleted),
    completedAt: row.completed_at,
  };
}

function mapRetentionSweep(row: RetentionSweepRow): AdminRetentionSweep {
  return {
    lastStartedAt: row.last_started_at,
    lastCompletedAt: row.last_completed_at,
    lastRecordsDeleted: Number(row.last_records_deleted),
    runCount: Number(row.run_count),
    lastErrorAt: row.last_error_at,
  };
}

export async function purgeDueActionResponses(
  now = new Date(),
  database: D1Database = env.DB,
): Promise<AdminRetentionEvent | null> {
  const completedAt = now.toISOString();
  const privacy = getPilotPrivacyConfiguration();
  const policyCutoff = privacy
    ? pilotClosingInstant(privacy.responseDeleteDate)
    : null;
  const policyIsDue = Boolean(
    policyCutoff && Date.parse(policyCutoff) <= now.getTime(),
  );
  const id = `retention_${crypto.randomUUID()}`;
  const results = await database.batch([
    database
      .prepare(
        `INSERT INTO retention_events (
        id, data_type, trigger, due_date, records_deleted, completed_at
      )
      SELECT ?1, 'action_responses', 'automatic',
        COALESCE(?2, MIN(delete_after), 'not-recorded'), COUNT(*), ?3
      FROM action_responses
      WHERE ${DUE_ACTION_RESPONSE_PREDICATE.replaceAll('?1', '?3').replaceAll('?2', '?4')}
      HAVING COUNT(*) > 0`,
      )
      .bind(id, policyIsDue ? policyCutoff : null, completedAt, policyCutoff),
    database
      .prepare(STOP_DUE_RESPONSE_ACTIONS_SQL)
      .bind(completedAt, policyCutoff),
    database
      .prepare(REVOKE_DUE_RESPONSE_INVITES_SQL)
      .bind(completedAt, policyCutoff),
    database
      .prepare(DELETE_DUE_ACTION_RESPONSES_SQL)
      .bind(completedAt, policyCutoff),
    database.prepare(DELETE_EXPIRED_ACTION_INVITES_SQL).bind(completedAt),
    database
      .prepare(DELETE_EXPIRED_RATE_LIMITS_SQL)
      .bind(Math.floor(now.getTime() / 1_000)),
  ]);
  if (Number(results[0]?.meta.changes ?? 0) !== 1) return null;
  const event = await database
    .prepare(
      `SELECT id, data_type, trigger, due_date, records_deleted, completed_at
     FROM retention_events WHERE id = ?`,
    )
    .bind(id)
    .first<RetentionEventRow>();
  return event ? mapRetentionEvent(event) : null;
}

export async function runScheduledActionResponseRetention(
  database: D1Database,
  now = new Date(),
): Promise<AdminRetentionSweep> {
  const startedAt = now.toISOString();
  try {
    const event = await purgeDueActionResponses(now, database);
    const completedAt = new Date().toISOString();
    const deleted = event?.recordsDeleted ?? 0;
    await database
      .prepare(
        `INSERT INTO retention_sweeps (
           id, last_started_at, last_completed_at, last_records_deleted,
           run_count, last_error_at
         ) VALUES ('action_responses', ?, ?, ?, 1, NULL)
         ON CONFLICT(id) DO UPDATE SET
           last_started_at = excluded.last_started_at,
           last_completed_at = excluded.last_completed_at,
           last_records_deleted = excluded.last_records_deleted,
           run_count = retention_sweeps.run_count + 1,
           last_error_at = NULL`,
      )
      .bind(startedAt, completedAt, deleted)
      .run();
    const row = await database
      .prepare(
        `SELECT last_started_at, last_completed_at, last_records_deleted,
           run_count, last_error_at
         FROM retention_sweeps WHERE id = 'action_responses'`,
      )
      .first<RetentionSweepRow>();
    if (!row) throw new Error('Retention sweep heartbeat was not stored.');
    return mapRetentionSweep(row);
  } catch (error) {
    const failedAt = new Date().toISOString();
    try {
      await database
        .prepare(
          `INSERT INTO retention_sweeps (
             id, last_started_at, last_completed_at, last_records_deleted,
             run_count, last_error_at
           ) VALUES ('action_responses', ?, NULL, 0, 1, ?)
           ON CONFLICT(id) DO UPDATE SET
             last_started_at = excluded.last_started_at,
             run_count = retention_sweeps.run_count + 1,
             last_error_at = excluded.last_error_at`,
        )
        .bind(startedAt, failedAt)
        .run();
    } catch {
      // A missing or stale heartbeat also fails closed if D1 cannot store the error.
    }
    throw error;
  }
}

export async function getActionResponseRetentionSweep(
  database: D1Database = env.DB,
): Promise<AdminRetentionSweep | null> {
  const row = await database
    .prepare(
      `SELECT last_started_at, last_completed_at, last_records_deleted,
       run_count, last_error_at
     FROM retention_sweeps WHERE id = 'action_responses'`,
    )
    .first<RetentionSweepRow>();
  return row ? mapRetentionSweep(row) : null;
}

export async function getAdminRetentionSweep(): Promise<AdminRetentionSweep | null> {
  return getActionResponseRetentionSweep();
}

export async function stopAndDeletePilotResponses(
  repairId: string,
): Promise<AdminRetentionEvent | null> {
  const repair = await env.DB.prepare(
    `SELECT id FROM repairs WHERE id = ? AND is_demo = 0`,
  )
    .bind(repairId)
    .first<{ id: string }>();
  if (!repair) return null;

  const completedAt = new Date().toISOString();
  const id = `retention_${crypto.randomUUID()}`;
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO retention_events (
        id, data_type, trigger, due_date, records_deleted, completed_at
      )
      SELECT ?, 'action_responses', 'manual',
        COALESCE(MIN(ar.delete_after), 'manual'), COUNT(*), ?
      FROM action_responses ar
      JOIN action_cards a ON a.id = ar.action_id
      WHERE a.repair_id = ?`,
    ).bind(id, completedAt, repairId),
    env.DB.prepare(
      `UPDATE action_cards
       SET status = 'stopped', is_preview = 1,
         pilot_terms_approved_at = NULL, pilot_approval_snapshot = NULL
       WHERE repair_id = ? AND participation_mode = 'direct_response'`,
    ).bind(repairId),
    env.DB.prepare(
      `UPDATE action_invites SET revoked_at = COALESCE(revoked_at, ?)
       WHERE action_id IN (
         SELECT id FROM action_cards WHERE repair_id = ?
       )`,
    ).bind(completedAt, repairId),
    env.DB.prepare(
      `DELETE FROM action_responses
       WHERE action_id IN (
         SELECT id FROM action_cards WHERE repair_id = ?
      )`,
    ).bind(repairId),
    env.DB.prepare(
      `DELETE FROM action_invites
       WHERE action_id IN (
         SELECT id FROM action_cards WHERE repair_id = ?
       )`,
    ).bind(repairId),
  ]);
  const event = await env.DB.prepare(
    `SELECT id, data_type, trigger, due_date, records_deleted, completed_at
     FROM retention_events WHERE id = ?`,
  )
    .bind(id)
    .first<RetentionEventRow>();
  return event ? mapRetentionEvent(event) : null;
}

export async function getAdminRetentionEvents(
  limit = 20,
): Promise<AdminRetentionEvent[]> {
  const result = await env.DB.prepare(
    `SELECT id, data_type, trigger, due_date, records_deleted, completed_at
     FROM retention_events ORDER BY completed_at DESC LIMIT ?`,
  )
    .bind(limit)
    .all<RetentionEventRow>();
  return result.results.map(mapRetentionEvent);
}

export async function getAdminActionResponses(
  repairId: string,
): Promise<AdminActionResponse[]> {
  await purgeDueActionResponses();
  const result = await env.DB.prepare(
    `SELECT ar.id, ar.action_id, a.title AS action_title,
      ar.questions, ar.answers, ar.consent_private_use,
      ar.consent_anonymous_summary, ar.confirmed_adult, ar.status,
      ar.delete_after, ar.created_at
     FROM action_responses ar
     JOIN action_cards a ON a.id = ar.action_id
     WHERE a.repair_id = ?
       AND ar.delete_after IS NOT NULL
       AND datetime(ar.delete_after) > datetime('now')
     ORDER BY ar.created_at DESC`,
  )
    .bind(repairId)
    .all<AdminActionResponseRow>();
  return result.results.map((row) => ({
    id: row.id,
    actionId: row.action_id,
    actionTitle: row.action_title,
    questions: parseStringList(row.questions),
    answers: parseStringList(row.answers),
    consentPrivateUse: Boolean(row.consent_private_use),
    consentAnonymousSummary: Boolean(row.consent_anonymous_summary),
    confirmedAdult: Boolean(row.confirmed_adult),
    status: row.status,
    deleteAfter: row.delete_after,
    createdAt: row.created_at,
  }));
}

export async function updateActionResponseStatus(
  id: string,
  status: AdminActionResponse['status'],
): Promise<boolean> {
  await purgeDueActionResponses();
  const row = await env.DB.prepare(
    `SELECT action_id, status AS response_status
     FROM action_responses WHERE id = ?`,
  )
    .bind(id)
    .first<{
      action_id: string;
      response_status: AdminActionResponse['status'];
    }>();
  if (!row) return false;

  const updated = await env.DB.prepare(
    `UPDATE action_responses
     SET status = ?, updated_at = ?
     WHERE id = ?
       AND (
         ? = 'rejected'
         OR status != 'rejected'
         OR (
           SELECT COUNT(*) FROM action_responses
           WHERE action_id = ? AND status != 'rejected' AND id != ?
         ) < (
           SELECT capacity FROM action_cards WHERE id = ?
         )
       )`,
  )
    .bind(
      status,
      new Date().toISOString(),
      id,
      status,
      row.action_id,
      id,
      row.action_id,
    )
    .run();
  if (Number(updated.meta.changes ?? 0) < 1) return false;

  if (status === 'rejected' && row.response_status !== 'rejected') {
    await env.DB.prepare(
      `UPDATE action_cards SET status = 'ready'
       WHERE id = ? AND participation_mode = 'direct_response'
         AND status = 'review' AND capacity - 1 = (
           SELECT COUNT(*) FROM action_responses
           WHERE action_id = ? AND status != 'rejected'
         )`,
    )
      .bind(row.action_id, row.action_id)
      .run();
  } else if (status !== 'rejected' && row.response_status === 'rejected') {
    await env.DB.prepare(
      `UPDATE action_cards SET status = 'review'
       WHERE id = ? AND participation_mode = 'direct_response'
         AND status IN ('ready', 'offered') AND capacity <= (
           SELECT COUNT(*) FROM action_responses
           WHERE action_id = ? AND status != 'rejected'
         )`,
    )
      .bind(row.action_id, row.action_id)
      .run();
  }
  return true;
}

export async function deleteActionResponse(id: string): Promise<boolean> {
  await purgeDueActionResponses();
  const row = await env.DB.prepare(
    `SELECT action_id, invite_id, status FROM action_responses WHERE id = ?`,
  )
    .bind(id)
    .first<{
      action_id: string;
      invite_id: string | null;
      status: AdminActionResponse['status'];
    }>();
  if (!row) return false;

  const statements = [
    env.DB.prepare(`DELETE FROM action_responses WHERE id = ?`).bind(id),
  ];
  if (row.invite_id) {
    statements.push(
      env.DB.prepare(
        `DELETE FROM action_invites
         WHERE id = ? AND NOT EXISTS (
           SELECT 1 FROM action_responses WHERE invite_id = ?
         )`,
      ).bind(row.invite_id, row.invite_id),
    );
  }
  const results = await env.DB.batch(statements);
  if (Number(results[0]?.meta.changes ?? 0) < 1) return false;

  if (row.status !== 'rejected') {
    await env.DB.prepare(
      `UPDATE action_cards SET status = 'ready'
       WHERE id = ? AND participation_mode = 'direct_response'
         AND status = 'review' AND capacity - 1 = (
           SELECT COUNT(*) FROM action_responses
           WHERE action_id = ? AND status != 'rejected'
         )`,
    )
      .bind(row.action_id, row.action_id)
      .run();
  }
  return true;
}

export async function createAppeal(input: AppealInput): Promise<string> {
  const id = `review_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO appeals (
      id, item_reference, request_type, explanation, evidence_links, email,
      accessibility_need, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
  )
    .bind(
      id,
      input.itemReference,
      input.requestType,
      input.explanation,
      input.evidenceLinks,
      input.email,
      input.accessibilityNeed,
      now,
      now,
    )
    .run();
  return id;
}

export async function getAdminProposals(): Promise<AdminProposal[]> {
  const result = await env.DB.prepare(
    `SELECT * FROM proposals WHERE status != 'deleted' ORDER BY created_at DESC LIMIT 100`,
  ).all<Record<string, string | number | null>>();

  return result.results.map((row) => ({
    id: String(row.id),
    workingTitle: String(row.working_title),
    problem: String(row.problem),
    broadLocation: row.broad_location ? String(row.broad_location) : null,
    affectedGroups: String(row.affected_groups),
    evidenceState: String(row.evidence_state),
    sourceLinks: String(row.source_links),
    desiredChange: String(row.desired_change),
    firstStep: String(row.first_step),
    helpNeeded: String(row.help_needed),
    relationship: String(row.relationship),
    chosenName: row.chosen_name ? String(row.chosen_name) : null,
    email: row.email ? String(row.email) : null,
    contactPreference: row.contact_preference
      ? String(row.contact_preference)
      : null,
    accessibilityNeed: row.accessibility_need
      ? String(row.accessibility_need)
      : null,
    privacyConcern: row.privacy_concern ? String(row.privacy_concern) : null,
    consentContact: Boolean(row.consent_contact),
    consentRedactedDraft: Boolean(row.consent_redacted_draft),
    backgroundOnly: Boolean(row.background_only),
    consentCredit: Boolean(row.consent_credit),
    consentAi: Boolean(row.consent_ai),
    status: String(row.status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function getAdminAppeals(): Promise<AdminAppeal[]> {
  const result = await env.DB.prepare(
    `SELECT * FROM appeals ORDER BY created_at DESC LIMIT 100`,
  ).all<Record<string, string | null>>();

  return result.results.map((row) => ({
    id: String(row.id),
    itemReference: String(row.item_reference),
    requestType: String(row.request_type),
    explanation: String(row.explanation),
    evidenceLinks: String(row.evidence_links),
    email: String(row.email),
    accessibilityNeed: row.accessibility_need
      ? String(row.accessibility_need)
      : null,
    status: String(row.status),
    reviewerId: row.reviewer_id ? String(row.reviewer_id) : null,
    decisionNote: row.decision_note ? String(row.decision_note) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function updateProposalStatus(
  id: string,
  status: string,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE proposals SET status = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(status, new Date().toISOString(), id)
    .run();
}

export async function updateAppealStatus(
  id: string,
  status: string,
  reviewerId: string,
  decisionNote: string | null,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE appeals
     SET status = ?, reviewer_id = ?, decision_note = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(status, reviewerId, decisionNote, new Date().toISOString(), id)
    .run();
}

export async function createRepairDraft(input: {
  title: string;
  summary: string;
}): Promise<string | null> {
  const uuid = crypto.randomUUID();
  const id = `repair_${uuid}`;
  const slug = `${slugFromTitle(input.title)}-${uuid.slice(0, 8)}`;
  const now = new Date();
  const reviewDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1_000)
    .toISOString()
    .slice(0, 10);
  const inserted = await env.DB.prepare(
    `INSERT INTO repairs (
      id, slug, title, summary, stage, scope, affected_groups, known_facts,
      unknowns, disputed_claims, desired_change, smallest_test, safeguards,
      owner_name, partner_name, review_date, updated_at, is_demo, is_published
    )
    SELECT ?, ?, ?, ?, 'framing', '', '', '', '', '', '', '', '', '',
      NULL, ?, ?, 0, 0
    WHERE NOT EXISTS (
      SELECT 1 FROM repairs WHERE is_demo = 0 AND is_published = 0
    )
      AND NOT EXISTS (
        SELECT 1 FROM repairs r
        WHERE r.is_demo = 0 AND r.is_published = 1
          AND (
            r.stage NOT IN ('closed', 'stopped')
            OR EXISTS (
              SELECT 1 FROM action_cards a
              WHERE a.repair_id = r.id
                AND a.participation_mode = 'direct_response'
                AND (
                  a.is_preview = 0
                  OR EXISTS (
                    SELECT 1 FROM action_responses ar
                    WHERE ar.action_id = a.id
                  )
                  OR EXISTS (
                    SELECT 1 FROM action_invites ai
                    WHERE ai.action_id = a.id AND ai.used_at IS NULL
                      AND ai.revoked_at IS NULL
                      AND datetime(ai.expires_at) > datetime('now')
                  )
                )
            )
          )
      )`,
  )
    .bind(id, slug, input.title, input.summary, reviewDate, now.toISOString())
    .run();
  return Number(inserted.meta.changes ?? 0) === 1 ? id : null;
}

export async function updateRepairDraftProblem(
  id: string,
  input: {
    title: string;
    summary: string;
    scope: string;
    affectedGroups: string;
    knownFacts: string;
    unknowns: string;
    disputedClaims: string;
  },
): Promise<boolean> {
  const result = await env.DB.prepare(
    `UPDATE repairs SET title = ?, summary = ?, scope = ?,
      affected_groups = ?, known_facts = ?, unknowns = ?,
      disputed_claims = ?, updated_at = ?
     WHERE id = ? AND is_demo = 0 AND is_published = 0`,
  )
    .bind(
      input.title,
      input.summary,
      input.scope,
      input.affectedGroups,
      input.knownFacts,
      input.unknowns,
      input.disputedClaims,
      new Date().toISOString(),
      id,
    )
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function updateRepairDraftChange(
  id: string,
  input: { desiredChange: string; smallestTest: string },
): Promise<boolean> {
  const result = await env.DB.prepare(
    `UPDATE repairs SET desired_change = ?, smallest_test = ?, updated_at = ?
     WHERE id = ? AND is_demo = 0 AND is_published = 0`,
  )
    .bind(input.desiredChange, input.smallestTest, new Date().toISOString(), id)
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function updateRepairDraftGuard(
  id: string,
  input: {
    safeguards: string;
    ownerName: string;
    partnerName: string;
    reviewDate: string;
  },
): Promise<boolean> {
  const result = await env.DB.prepare(
    `UPDATE repairs SET safeguards = ?, owner_name = ?, partner_name = ?,
      review_date = ?, updated_at = ?
     WHERE id = ? AND is_demo = 0 AND is_published = 0`,
  )
    .bind(
      input.safeguards,
      input.ownerName,
      input.partnerName,
      input.reviewDate,
      new Date().toISOString(),
      id,
    )
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function createInitialActionDraft(
  repairId: string,
): Promise<string | null> {
  const id = `action_${crypto.randomUUID()}`;
  const result = await env.DB.prepare(
    `INSERT INTO action_cards (
      id, repair_id, title, intended_output, why_it_matters, time_size,
      compensation, participation_mode, response_questions, response_path,
      is_preview, skills_needed, location_mode, owner_name, reviewer_name,
      capacity, status, evidence_required, review_date, stop_condition,
      sort_order
    )
    SELECT ?, r.id, '', '', '', '', 'Pay not set — job cannot open',
      'offer', '[]', NULL, 0, '', '', '', '', 1, 'stopped', '', r.review_date,
      '', 1
    FROM repairs r
    WHERE r.id = ? AND r.is_demo = 0 AND r.is_published = 0
      AND NOT EXISTS (
        SELECT 1 FROM action_cards a WHERE a.repair_id = r.id
      )`,
  )
    .bind(id, repairId)
    .run();
  return Number(result.meta.changes ?? 0) > 0 ? id : null;
}

export async function updateInitialActionDraftBasics(
  id: string,
  input: {
    title: string;
    intendedOutput: string;
    whyItMatters: string;
    timeSize: string;
    compensation: string;
  },
): Promise<boolean> {
  const result = await env.DB.prepare(
    `UPDATE action_cards SET title = ?, intended_output = ?,
      why_it_matters = ?, time_size = ?, compensation = ?
     WHERE id = ? AND participation_mode = 'offer'
       AND repair_id IN (
         SELECT id FROM repairs WHERE is_demo = 0 AND is_published = 0
       )`,
  )
    .bind(
      input.title,
      input.intendedOutput,
      input.whyItMatters,
      input.timeSize,
      input.compensation,
      id,
    )
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function updateInitialActionDraftGuard(
  id: string,
  input: {
    skillsNeeded: string;
    locationMode: string;
    ownerName: string;
    reviewerName: string;
    capacity: number;
    evidenceRequired: string;
    reviewDate: string;
    stopCondition: string;
  },
): Promise<boolean> {
  const result = await env.DB.prepare(
    `UPDATE action_cards SET skills_needed = ?, location_mode = ?,
      owner_name = ?, reviewer_name = ?, capacity = ?, evidence_required = ?,
      review_date = ?, stop_condition = ?
     WHERE id = ? AND participation_mode = 'offer'
       AND repair_id IN (
         SELECT id FROM repairs WHERE is_demo = 0 AND is_published = 0
       )
       AND date(?) <= (
         SELECT date(review_date) FROM repairs
         WHERE id = action_cards.repair_id AND is_published = 0
       )`,
  )
    .bind(
      input.skillsNeeded,
      input.locationMode,
      input.ownerName,
      input.reviewerName,
      input.capacity,
      input.evidenceRequired,
      input.reviewDate,
      input.stopCondition,
      id,
      input.reviewDate,
    )
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function publishRepairDraft(
  id: string,
  expected: PublicationGuard,
): Promise<'published' | 'stale' | 'not_ready'> {
  const bundle = await getAdminRepairBundle(id);
  const action = bundle?.actions[0];
  if (
    !bundle ||
    !action ||
    bundle.actions.length !== 1 ||
    !repairCanPublish(bundle.repair, bundle.actions) ||
    !pilotClosingDateIsAllowed(bundle.repair.reviewDate) ||
    !pilotClosingDateIsAllowed(action.reviewDate) ||
    action.reviewDate > bundle.repair.reviewDate
  ) {
    return 'not_ready';
  }
  const current = bundle.repair.publicationGuard;
  if (
    !current ||
    current.revision !== expected.revision ||
    current.snapshotHash !== expected.snapshotHash
  ) {
    return 'stale';
  }
  const result = await env.DB.prepare(PUBLISH_REPAIR_DRAFT_SQL)
    .bind(
      new Date().toISOString(),
      current.snapshotHash,
      id,
      current.revision,
      action.id,
    )
    .run();
  return Number(result.meta.changes ?? 0) === 1 ? 'published' : 'stale';
}

export async function createRepairUpdateDraft(input: {
  repairId: string;
  title: string;
  body: string;
  evidenceChanged: string;
  remainsUnfair: string;
  nextOwner: string;
  nextReviewDate: string;
}): Promise<string | null> {
  const id = `update_${crypto.randomUUID()}`;
  const result = await env.DB.prepare(
    `INSERT INTO repair_updates (
      id, repair_id, title, body, evidence_changed, remains_unfair,
      next_owner, next_review_date, published_at, is_published
    )
    SELECT ?, r.id, ?, ?, ?, ?, ?, ?, ?, 0
    FROM repairs r
    WHERE r.id = ? AND r.is_demo = 0 AND r.is_published = 1
      AND NOT EXISTS (
        SELECT 1 FROM repair_updates u
        WHERE u.repair_id = r.id AND u.is_published = 0
      )`,
  )
    .bind(
      id,
      input.title,
      input.body,
      input.evidenceChanged,
      input.remainsUnfair,
      input.nextOwner,
      input.nextReviewDate,
      new Date().toISOString(),
      input.repairId,
    )
    .run();
  return Number(result.meta.changes ?? 0) === 1 ? id : null;
}

export async function updateRepairUpdateDraft(
  id: string,
  input: {
    title: string;
    body: string;
    evidenceChanged: string;
    remainsUnfair: string;
    nextOwner: string;
    nextReviewDate: string;
  },
): Promise<boolean> {
  const result = await env.DB.prepare(
    `UPDATE repair_updates SET title = ?, body = ?, evidence_changed = ?,
      remains_unfair = ?, next_owner = ?, next_review_date = ?
     WHERE id = ? AND is_published = 0
       AND repair_id IN (
         SELECT id FROM repairs WHERE is_demo = 0 AND is_published = 1
       )`,
  )
    .bind(
      input.title,
      input.body,
      input.evidenceChanged,
      input.remainsUnfair,
      input.nextOwner,
      input.nextReviewDate,
      id,
    )
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function publishRepairUpdateDraft(
  id: string,
  expected: PublicationGuard,
): Promise<'published' | 'stale' | 'not_ready'> {
  const row = await env.DB.prepare(
    `SELECT id, repair_id, title, body, evidence_changed, remains_unfair,
       next_owner, next_review_date, published_at, is_published,
       publication_revision, published_snapshot_hash
     FROM repair_updates
     WHERE id = ? AND is_published = 0`,
  )
    .bind(id)
    .first<AdminUpdateRow>();
  if (!row || !pilotClosingDateIsAllowed(row.next_review_date)) {
    return 'not_ready';
  }
  const draft = await mapAdminUpdate(row);
  const current = draft.publicationGuard;
  if (
    !current ||
    current.revision !== expected.revision ||
    current.snapshotHash !== expected.snapshotHash
  ) {
    return 'stale';
  }
  const now = new Date().toISOString();
  const results = await env.DB.batch([
    env.DB.prepare(PUBLISH_REPAIR_UPDATE_DRAFT_SQL).bind(
      now,
      current.snapshotHash,
      id,
      current.revision,
    ),
    env.DB.prepare(APPLY_PUBLISHED_UPDATE_TO_REPAIR_SQL).bind(
      row.next_review_date,
      now,
      id,
      current.revision,
      current.snapshotHash,
    ),
  ]);
  return Number(results[0]?.meta.changes ?? 0) === 1 &&
    Number(results[1]?.meta.changes ?? 0) === 1
    ? 'published'
    : 'stale';
}

export async function updateRepairStage(
  id: string,
  stage: string,
): Promise<void> {
  const now = new Date().toISOString();
  if (stage === 'closed' || stage === 'stopped') {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE repairs SET stage = ?, updated_at = ? WHERE id = ?`,
      ).bind(stage, now, id),
      env.DB.prepare(
        `UPDATE action_cards SET status = 'stopped' WHERE repair_id = ?`,
      ).bind(id),
      env.DB.prepare(
        `UPDATE action_cards
         SET is_preview = 1, pilot_terms_approved_at = NULL,
           pilot_approval_snapshot = NULL
         WHERE repair_id = ? AND participation_mode = 'direct_response'`,
      ).bind(id),
      env.DB.prepare(
        `UPDATE action_invites SET revoked_at = ?
         WHERE revoked_at IS NULL AND used_at IS NULL
           AND action_id IN (
             SELECT id FROM action_cards WHERE repair_id = ?
           )
           AND NOT EXISTS (
             SELECT 1 FROM action_responses ar
             WHERE ar.invite_id = action_invites.id
           )`,
      ).bind(now, id),
    ]);
    return;
  }
  await env.DB.prepare(
    `UPDATE repairs SET stage = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(stage, now, id)
    .run();
}

export async function updateActionStatus(
  id: string,
  status: string,
): Promise<boolean> {
  const result = await env.DB.prepare(
    `UPDATE action_cards SET status = ?
     WHERE id = ? AND participation_mode != 'direct_response'
       AND repair_id IN (
         SELECT id FROM repairs WHERE is_published = 1 AND is_demo = 0
       )
       AND (
         ? NOT IN ('ready', 'offered')
         OR (
           compensation != 'Pay not set — job cannot open'
           AND date(review_date) >= date('now')
           AND repair_id IN (
             SELECT id FROM repairs
             WHERE is_published = 1 AND stage NOT IN ('closed', 'stopped')
           )
         )
       )`,
  )
    .bind(status, id, status)
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

type OutcomeDraftInput = {
  repairId: string;
  title: string;
  activity: string;
  observedEffect: string;
  evidence: string;
  evidenceUrl: string | null;
  confidence: OutcomeConfidence;
  verifierName: string;
  whoBenefited: string;
  whatDidNotChange: string;
  learning: string;
  sourceMode: OutcomeSourceMode;
};

export type OutcomePublicationResult =
  | 'saved'
  | 'published'
  | 'stale'
  | 'not_ready'
  | 'not_found';

async function getOutcomeDraftById(id: string): Promise<AdminOutcome | null> {
  const row = await env.DB.prepare(
    `SELECT id, repair_id, title, activity, observed_effect, evidence,
      evidence_url, confidence, verifier_name, who_benefited,
      what_did_not_change, learning, source_mode, source_reply_count,
      publication_revision, reviewed_revision, reviewed_snapshot_hash,
      published_snapshot_hash, consent_checked_at, published_at,
      is_published, sort_order
     FROM outcomes WHERE id = ? AND is_published = 0`,
  )
    .bind(id)
    .first<AdminOutcomeRow>();
  if (!row) return null;
  const sources = await env.DB.prepare(
    `SELECT outcome_id, response_id FROM outcome_response_sources
     WHERE outcome_id = ? ORDER BY response_id`,
  )
    .bind(id)
    .all<OutcomeSourceRow>();
  return mapAdminOutcome(
    row,
    sources.results.map((source) => source.response_id),
  );
}

function publicEvidenceUrlIsValid(value: string | null): boolean {
  return publicEvidenceUrlIsSafe(value);
}

function outcomeSourcesAreReady(outcome: AdminOutcome): boolean {
  return (
    outcome.sourceMode === 'public_evidence_only' &&
    outcome.selectedResponseIds.length === 0 &&
    publicEvidenceUrlIsValid(outcome.evidenceUrl)
  );
}

export async function createOutcomeDraft(
  input: OutcomeDraftInput,
): Promise<string | null> {
  const id = `outcome_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO outcomes (
      id, repair_id, title, activity, observed_effect, evidence, evidence_url,
      confidence, verifier_name, who_benefited, what_did_not_change, learning,
      source_mode, source_reply_count, created_at, updated_at, published_at,
      is_published, sort_order
    )
    SELECT ?, r.id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NULL, 0, 999
    FROM repairs r
    WHERE r.id = ? AND r.is_demo = 0 AND r.is_published = 1
      AND NOT EXISTS (
        SELECT 1 FROM outcomes o
        WHERE o.repair_id = r.id AND o.is_published = 0
      )`,
  )
    .bind(
      id,
      input.title,
      input.activity,
      input.observedEffect,
      input.evidence,
      input.evidenceUrl,
      input.confidence,
      input.verifierName,
      input.whoBenefited,
      input.whatDidNotChange,
      input.learning,
      input.sourceMode,
      now,
      now,
      input.repairId,
    )
    .run();
  return Number(result.meta.changes ?? 0) === 1 ? id : null;
}

export async function updateOutcomeDraft(
  id: string,
  input: Omit<OutcomeDraftInput, 'repairId'>,
): Promise<boolean> {
  const results = await env.DB.batch([
    env.DB.prepare(
      `UPDATE outcomes
         SET title = ?, activity = ?, observed_effect = ?, evidence = ?,
           evidence_url = ?, confidence = ?, verifier_name = ?,
           who_benefited = ?, what_did_not_change = ?, learning = ?,
           source_mode = ?, updated_at = ?
         WHERE id = ? AND is_published = 0
           AND repair_id IN (
             SELECT id FROM repairs WHERE is_demo = 0 AND is_published = 1
           )`,
    ).bind(
      input.title,
      input.activity,
      input.observedEffect,
      input.evidence,
      input.evidenceUrl,
      input.confidence,
      input.verifierName,
      input.whoBenefited,
      input.whatDidNotChange,
      input.learning,
      input.sourceMode,
      new Date().toISOString(),
      id,
    ),
    env.DB.prepare(
      `DELETE FROM outcome_response_sources
       WHERE changes() >= 1 AND outcome_id = ? AND EXISTS (
         SELECT 1 FROM outcomes
         WHERE id = ? AND is_published = 0
           AND source_mode = 'public_evidence_only'
       )`,
    ).bind(id, id),
  ]);
  return Number(results[0]?.meta.changes ?? 0) > 0;
}

export async function reviewOutcomeDraft(
  id: string,
  expected: PublicationGuard,
  sourceCheck: {
    noPrivateRepliesUsed: boolean;
    publicEvidenceOpened: boolean;
    publicEvidenceContainsNoPrivateMaterial: boolean;
  },
): Promise<OutcomePublicationResult> {
  await purgeDueActionResponses();
  const outcome = await getOutcomeDraftById(id);
  if (!outcome) return 'not_found';
  const current = outcome.publicationGuard;
  if (
    !current ||
    current.revision !== expected.revision ||
    current.snapshotHash !== expected.snapshotHash
  ) {
    return 'stale';
  }
  if (
    outcome.sourceMode !== 'public_evidence_only' ||
    !sourceCheck.noPrivateRepliesUsed ||
    !sourceCheck.publicEvidenceOpened ||
    !sourceCheck.publicEvidenceContainsNoPrivateMaterial
  ) {
    return 'not_ready';
  }
  const now = new Date();
  if (!outcomeSourcesAreReady(outcome)) return 'not_ready';
  const updated = await env.DB.prepare(
    `UPDATE outcomes
     SET reviewed_revision = ?, reviewed_snapshot_hash = ?,
       consent_checked_at = ?, updated_at = ?
     WHERE id = ? AND is_published = 0 AND publication_revision = ?`,
  )
    .bind(
      current.revision,
      current.snapshotHash,
      now.toISOString(),
      now.toISOString(),
      id,
      current.revision,
    )
    .run();
  return Number(updated.meta.changes ?? 0) === 1 ? 'saved' : 'stale';
}

export async function publishReviewedOutcomeDraft(
  id: string,
  expected: PublicationGuard,
): Promise<OutcomePublicationResult> {
  await purgeDueActionResponses();
  const outcome = await getOutcomeDraftById(id);
  if (!outcome) return 'not_found';
  const current = outcome.publicationGuard;
  const reviewed = outcome.reviewedGuard;
  if (
    !current ||
    current.revision !== expected.revision ||
    current.snapshotHash !== expected.snapshotHash ||
    !reviewed ||
    reviewed.revision !== current.revision ||
    reviewed.snapshotHash !== current.snapshotHash ||
    !outcome.consentCheckedAt
  ) {
    return 'stale';
  }
  const now = new Date();
  if (outcome.sourceMode !== 'public_evidence_only') {
    return 'not_ready';
  }
  if (!outcomeSourcesAreReady(outcome)) return 'not_ready';
  const publishedAt = now.toISOString();
  const sourceCount = outcome.selectedResponseIds.length;
  const publishedHash = await publicationSnapshotHash(
    outcomePublishedSnapshot(outcome, sourceCount),
  );
  const publicationNonce = `publishing:${crypto.randomUUID()}`;

  const results = await env.DB.batch([
    env.DB.prepare(
      `UPDATE outcomes
         SET is_published = 1, published_at = ?, source_reply_count = 0,
           published_snapshot_hash = ?, reviewed_snapshot_hash = ?,
           updated_at = ?
         WHERE id = ? AND is_published = 0
           AND source_mode = 'public_evidence_only'
           AND publication_revision = ? AND reviewed_revision = ?
           AND reviewed_snapshot_hash = ?
           AND NOT EXISTS (
             SELECT 1 FROM outcome_response_sources WHERE outcome_id = ?
           )
           AND EXISTS (
             SELECT 1 FROM repairs r
             WHERE r.id = outcomes.repair_id
               AND r.is_published = 1 AND r.is_demo = 0
           )`,
    ).bind(
      publishedAt,
      publishedHash,
      publicationNonce,
      publishedAt,
      id,
      current.revision,
      current.revision,
      current.snapshotHash,
      id,
    ),
    env.DB.prepare(
      `UPDATE outcomes SET reviewed_snapshot_hash = NULL
         WHERE id = ? AND is_published = 1
           AND reviewed_snapshot_hash = ?`,
    ).bind(id, publicationNonce),
  ]);
  return Number(results[0]?.meta.changes ?? 0) === 1 ? 'published' : 'stale';
}

export async function discardOutcomeDraft(id: string): Promise<boolean> {
  const result = await env.DB.prepare(
    `DELETE FROM outcomes WHERE id = ? AND is_published = 0`,
  )
    .bind(id)
    .run();
  return Number(result.meta.changes ?? 0) === 1;
}

export async function countRecentStewardBriefs(
  repairId: string,
  since: string,
) {
  const result = await env.DB.prepare(
    `SELECT COUNT(*) AS count FROM steward_briefs
     WHERE repair_id = ? AND generated_at >= ?`,
  )
    .bind(repairId, since)
    .first<{ count: number }>();
  return Number(result?.count ?? 0);
}

export async function createStewardBrief(input: {
  repairId: string;
  sourceChecksum: string;
  summary: string;
  nextAction: string;
  blockers: string[];
  draftUpdate: string;
  questions: string[];
  model: string;
}) {
  const id = `steward_${crypto.randomUUID()}`;
  await env.DB.prepare(
    `INSERT INTO steward_briefs (
      id, repair_id, source_checksum, summary, next_action, blockers,
      draft_update, questions, model, status, generated_at, reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, NULL)`,
  )
    .bind(
      id,
      input.repairId,
      input.sourceChecksum,
      input.summary,
      input.nextAction,
      JSON.stringify(input.blockers),
      input.draftUpdate,
      JSON.stringify(input.questions),
      input.model,
      new Date().toISOString(),
    )
    .run();
  return id;
}

export async function getAdminStewardBriefs(
  repairId: string,
): Promise<StewardBrief[]> {
  const result = await env.DB.prepare(
    `SELECT id, repair_id, source_checksum, summary, next_action, blockers,
      draft_update, questions, model, status, generated_at, reviewed_at
     FROM steward_briefs WHERE repair_id = ?
     ORDER BY generated_at DESC LIMIT 12`,
  )
    .bind(repairId)
    .all<StewardRow>();
  return result.results.map(mapStewardBrief);
}

export async function updateStewardBriefStatus(
  id: string,
  status: StewardBrief['status'],
) {
  await env.DB.prepare(
    `UPDATE steward_briefs SET status = ?, reviewed_at = ? WHERE id = ?`,
  )
    .bind(status, new Date().toISOString(), id)
    .run();
}
