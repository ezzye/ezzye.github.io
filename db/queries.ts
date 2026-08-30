import { env } from 'cloudflare:workers';

import { demoBundle } from '@/lib/demo-data';
import {
  createActionInviteToken,
  hashActionInviteToken,
} from '@/lib/action-invites';
import { RESERVE_ACTION_INVITE_SQL } from '@/lib/action-invite-sql';
import { pilotClosingInstant } from '@/lib/pilot-rules';
import type { PilotApprovalTerms } from '@/lib/public-intake';
import type {
  ActionCard,
  ActionOfferInput,
  AdminActionInvite,
  AdminActionResponse,
  AdminAppeal,
  AdminProposal,
  AppealInput,
  Correction,
  Outcome,
  OutcomeConfidence,
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
  published_at: string;
  sort_order: number;
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
  created_at: string;
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
    publishedAt: row.published_at,
    sortOrder: row.sort_order,
  };
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
          what_did_not_change, learning, published_at, sort_order
        FROM outcomes
        WHERE repair_id = ? AND is_published = 1
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

export async function getHomeRepairBundle(): Promise<RepairBundle> {
  try {
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
        o.what_did_not_change, o.learning, o.published_at, o.sort_order
      FROM outcomes o
      JOIN repairs r ON r.id = o.repair_id
      WHERE o.is_published = 1 AND r.is_published = 1
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
}): Promise<string | null> {
  const id = `response_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const inserted = await env.DB.prepare(
    `INSERT OR IGNORE INTO action_responses (
      id, action_id, invite_id, questions, answers, consent_private_use,
      consent_anonymous_summary, confirmed_adult, status, created_at,
      updated_at
    )
    SELECT ?, a.id, ai.id, a.response_questions, ?, ?, ?, ?, 'new', ?, ?
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

export async function getAdminActionResponses(
  repairId: string,
): Promise<AdminActionResponse[]> {
  const result = await env.DB.prepare(
    `SELECT ar.id, ar.action_id, a.title AS action_title,
      ar.questions, ar.answers, ar.consent_private_use,
      ar.consent_anonymous_summary, ar.confirmed_adult, ar.status,
      ar.created_at
     FROM action_responses ar
     JOIN action_cards a ON a.id = ar.action_id
     WHERE a.repair_id = ?
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
    createdAt: row.created_at,
  }));
}

export async function updateActionResponseStatus(
  id: string,
  status: AdminActionResponse['status'],
): Promise<boolean> {
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
  if (Number(updated.meta.changes ?? 0) !== 1) return false;

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
  const row = await env.DB.prepare(
    `SELECT action_id, status FROM action_responses WHERE id = ?`,
  )
    .bind(id)
    .first<{
      action_id: string;
      status: AdminActionResponse['status'];
    }>();
  if (!row) return false;

  const deleted = await env.DB.prepare(
    `DELETE FROM action_responses WHERE id = ?`,
  )
    .bind(id)
    .run();
  if (Number(deleted.meta.changes ?? 0) !== 1) return false;

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
     WHERE id = ? AND participation_mode != 'direct_response'`,
  )
    .bind(status, id)
    .run();
  return Number(result.meta.changes ?? 0) === 1;
}

export async function publishOutcome(input: {
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
}): Promise<string> {
  const id = `outcome_${crypto.randomUUID()}`;
  await env.DB.prepare(
    `INSERT INTO outcomes (
      id, repair_id, title, activity, observed_effect, evidence, evidence_url,
      confidence, verifier_name, who_benefited, what_did_not_change, learning,
      published_at, is_published, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 999)`,
  )
    .bind(
      id,
      input.repairId,
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
      new Date().toISOString(),
    )
    .run();
  return id;
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
