import { isStrictIsoDate } from './pilot-rules.ts';
import type { ActionCard, AdminRepair, AdminRepairUpdate } from '@/lib/types';

export type RepairDraftStep =
  | 'problem'
  | 'change'
  | 'guard'
  | 'start-action'
  | 'action-basics'
  | 'action-guard'
  | 'publish';

function hasText(value: string | null | undefined, minimum: number) {
  return Boolean(value && value.trim().length >= minimum);
}

export function slugFromTitle(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '');
  return slug || 'repair';
}

export function repairProblemIsComplete(repair: AdminRepair): boolean {
  return (
    hasText(repair.title, 5) &&
    hasText(repair.summary, 20) &&
    hasText(repair.scope, 10) &&
    hasText(repair.affectedGroups, 10) &&
    hasText(repair.knownFacts, 10) &&
    hasText(repair.unknowns, 10) &&
    hasText(repair.disputedClaims, 4)
  );
}

export function repairChangeIsComplete(repair: AdminRepair): boolean {
  return hasText(repair.desiredChange, 20) && hasText(repair.smallestTest, 20);
}

export function repairGuardIsComplete(repair: AdminRepair): boolean {
  return (
    hasText(repair.safeguards, 20) &&
    hasText(repair.ownerName, 2) &&
    hasText(repair.partnerName, 2) &&
    isStrictIsoDate(repair.reviewDate)
  );
}

export function actionBasicsAreComplete(action: ActionCard): boolean {
  return (
    hasText(action.title, 5) &&
    hasText(action.intendedOutput, 10) &&
    hasText(action.whyItMatters, 10) &&
    hasText(action.timeSize, 2) &&
    hasText(action.compensation, 10) &&
    action.compensation !== 'Pay not set — job cannot open'
  );
}

export function actionGuardIsComplete(action: ActionCard): boolean {
  return (
    hasText(action.skillsNeeded, 2) &&
    hasText(action.locationMode, 2) &&
    hasText(action.ownerName, 2) &&
    hasText(action.reviewerName, 2) &&
    action.capacity >= 1 &&
    action.capacity <= 10 &&
    hasText(action.evidenceRequired, 10) &&
    isStrictIsoDate(action.reviewDate) &&
    hasText(action.stopCondition, 10)
  );
}

export function repairDraftNextStep(
  repair: AdminRepair,
  actions: ActionCard[],
): RepairDraftStep | null {
  if (repair.isPublished) return null;
  if (!repairProblemIsComplete(repair)) return 'problem';
  if (!repairChangeIsComplete(repair)) return 'change';
  if (!repairGuardIsComplete(repair)) return 'guard';
  const action = actions[0];
  if (!action) return 'start-action';
  if (!actionBasicsAreComplete(action)) return 'action-basics';
  if (!actionGuardIsComplete(action)) return 'action-guard';
  return 'publish';
}

export function repairCanPublish(
  repair: AdminRepair,
  actions: ActionCard[],
): boolean {
  const action = actions[0];
  return (
    actions.length === 1 &&
    Boolean(action) &&
    action.repairId === repair.id &&
    action.participationMode === 'offer' &&
    action.status === 'stopped' &&
    !action.isPreview &&
    action.responsePath === null &&
    action.responseQuestions.length === 0 &&
    repairDraftNextStep(repair, actions) === 'publish'
  );
}

export function currentUpdateDraft(
  updates: AdminRepairUpdate[],
): AdminRepairUpdate | null {
  return updates.find((update) => !update.isPublished) ?? null;
}
