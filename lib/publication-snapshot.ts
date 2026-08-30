import type {
  ActionCard,
  AdminOutcome,
  AdminRepair,
  AdminRepairUpdate,
  OutcomeSourceMode,
  Repair,
  RepairUpdate,
} from '@/lib/types';

type OutcomeSnapshotInput = {
  id: string;
  repairId: string;
  title: string;
  activity: string;
  observedEffect: string;
  evidence: string;
  evidenceUrl: string | null;
  confidence: AdminOutcome['confidence'];
  verifierName: string;
  whoBenefited: string;
  whatDidNotChange: string;
  learning: string;
  sourceMode: OutcomeSourceMode;
};

export function repairPublicationSnapshot(
  repair: Repair | AdminRepair,
  action: ActionCard,
) {
  return {
    schemaVersion: 1,
    repair: {
      id: repair.id,
      slug: repair.slug,
      title: repair.title,
      summary: repair.summary,
      stage: 'acting',
      scope: repair.scope,
      affectedGroups: repair.affectedGroups,
      knownFacts: repair.knownFacts,
      unknowns: repair.unknowns,
      disputedClaims: repair.disputedClaims,
      desiredChange: repair.desiredChange,
      smallestTest: repair.smallestTest,
      safeguards: repair.safeguards,
      ownerName: repair.ownerName,
      partnerName: repair.partnerName,
      reviewDate: repair.reviewDate,
      isDemo: repair.isDemo,
    },
    action: {
      id: action.id,
      repairId: action.repairId,
      title: action.title,
      intendedOutput: action.intendedOutput,
      whyItMatters: action.whyItMatters,
      timeSize: action.timeSize,
      compensation: action.compensation,
      participationMode: action.participationMode,
      responseQuestions: action.responseQuestions,
      responsePath: action.responsePath,
      isPreview: action.isPreview,
      skillsNeeded: action.skillsNeeded,
      locationMode: action.locationMode,
      ownerName: action.ownerName,
      reviewerName: action.reviewerName,
      capacity: action.capacity,
      status: action.status,
      evidenceRequired: action.evidenceRequired,
      reviewDate: action.reviewDate,
      stopCondition: action.stopCondition,
      sortOrder: action.sortOrder,
    },
  };
}

export function repairUpdatePublicationSnapshot(
  update: RepairUpdate | AdminRepairUpdate,
) {
  return {
    schemaVersion: 1,
    update: {
      id: update.id,
      repairId: update.repairId,
      title: update.title,
      body: update.body,
      evidenceChanged: update.evidenceChanged,
      remainsUnfair: update.remainsUnfair,
      nextOwner: update.nextOwner,
      nextReviewDate: update.nextReviewDate,
    },
  };
}

export function outcomeDraftPublicationSnapshot(
  outcome: OutcomeSnapshotInput,
  selectedResponseIds: string[],
) {
  return {
    schemaVersion: 1,
    outcome: outcomePublicWords(outcome),
    sources: {
      mode: outcome.sourceMode,
      selectedResponseIds: [...selectedResponseIds].sort(),
    },
  };
}

export function outcomePublishedSnapshot(
  outcome: OutcomeSnapshotInput,
  sourceReplyCount: number,
) {
  return {
    schemaVersion: 1,
    outcome: outcomePublicWords(outcome),
    sources: {
      mode: outcome.sourceMode,
      replyCount: sourceReplyCount,
    },
  };
}

function outcomePublicWords(outcome: OutcomeSnapshotInput) {
  return {
    id: outcome.id,
    repairId: outcome.repairId,
    title: outcome.title,
    activity: outcome.activity,
    observedEffect: outcome.observedEffect,
    evidence: outcome.evidence,
    evidenceUrl: outcome.evidenceUrl,
    confidence: outcome.confidence,
    verifierName: outcome.verifierName,
    whoBenefited: outcome.whoBenefited,
    whatDidNotChange: outcome.whatDidNotChange,
    learning: outcome.learning,
  };
}

export async function publicationSnapshotHash(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return `v1:sha256:${hex}`;
}
