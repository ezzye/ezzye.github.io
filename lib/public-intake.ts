import { env } from 'cloudflare:workers';

import {
  isStrictIsoDate,
  isValidPublicEmail,
  pilotApprovalSnapshotIsCurrent,
} from '@/lib/pilot-rules';
import { retentionHeartbeatIsRecent } from '@/lib/retention-health';
import type { AdminRetentionSweep } from '@/lib/types';

export type PilotPrivacyConfiguration = {
  contactEmail: string;
  dataOwner: string;
  replyTime: string;
  lawfulBasis: string;
  recipients: string;
  responseDeleteDate: string;
};

export type PilotInviteAuthorization = {
  approvalReference: string;
  recruitmentPlan: string;
  replyReader: string;
};

export type PilotApprovalTerms = {
  title: string;
  intendedOutput: string;
  whyItMatters: string;
  timeSize: string;
  compensation: string;
  responseQuestions: string[];
  responsePath: string | null;
  skillsNeeded: string;
  locationMode: string;
  ownerName: string;
  reviewerName: string;
  capacity: number;
  evidenceRequired: string;
  reviewDate: string;
  stopCondition: string;
  pilotTermsApprovedAt: string | null;
  pilotApprovalSnapshot: string | null;
};

function configuredText(value: string | undefined): string | null {
  const text = value?.trim();
  return text || null;
}

export function getPublicContactEmail(): string | null {
  const value = env.PUBLIC_CONTACT_EMAIL?.trim().toLowerCase();
  return value && isValidPublicEmail(value) ? value : null;
}

export function getPublicPrivacyReplyTime(): string | null {
  return configuredText(env.PUBLIC_PRIVACY_REPLY_TIME);
}

export function getPublicDataOwner(): string | null {
  return configuredText(env.PUBLIC_DATA_OWNER);
}

export function publicIntakeIsOpen(): boolean {
  return (
    isEnabled(env.PUBLIC_INTAKE_ENABLED) &&
    isEnabled(env.PUBLIC_INTAKE_PRIVACY_READY) &&
    isEnabled(env.PUBLIC_INTAKE_STAFFED) &&
    Boolean(getPublicContactEmail()) &&
    Boolean(getPublicDataOwner()) &&
    Boolean(getPublicPrivacyReplyTime())
  );
}

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

export function pilotPrivacyIsReady(reviewDate?: string): boolean {
  const configuration = getPilotPrivacyConfiguration();
  return Boolean(
    isEnabled(env.PILOT_PRIVACY_READY) &&
    configuration &&
    (!reviewDate || configuration.responseDeleteDate > reviewDate),
  );
}

export function getPilotPrivacyConfiguration(): PilotPrivacyConfiguration | null {
  const contactEmail = getPublicContactEmail();
  const dataOwner = getPublicDataOwner();
  const replyTime = getPublicPrivacyReplyTime();
  const lawfulBasis = configuredText(env.PUBLIC_LAWFUL_BASIS);
  const recipients = configuredText(env.PUBLIC_DATA_RECIPIENTS);
  const responseDeleteDate = configuredText(env.PILOT_RESPONSE_DELETE_DATE);
  if (
    !contactEmail ||
    !dataOwner ||
    !replyTime ||
    !lawfulBasis ||
    !recipients ||
    !responseDeleteDate ||
    !isStrictIsoDate(responseDeleteDate)
  ) {
    return null;
  }
  return {
    contactEmail,
    dataOwner,
    replyTime,
    lawfulBasis,
    recipients,
    responseDeleteDate,
  };
}

export function getPilotInviteAuthorization(): PilotInviteAuthorization | null {
  const approvalReference = configuredText(env.PILOT_INVITE_APPROVAL_REFERENCE);
  const recruitmentPlan = configuredText(env.PILOT_RECRUITMENT_PLAN);
  const replyReader = configuredText(env.PILOT_REPLY_READER);
  if (
    !isEnabled(env.PILOT_INVITES_AUTHORIZED) ||
    !approvalReference ||
    !recruitmentPlan ||
    !replyReader
  ) {
    return null;
  }
  return { approvalReference, recruitmentPlan, replyReader };
}

export function pilotInvitesAreAuthorized(): boolean {
  return Boolean(getPilotInviteAuthorization());
}

export function getCurrentPilotApprovalSnapshot(
  action: PilotApprovalTerms,
): string | null {
  const privacy = getPilotPrivacyConfiguration();
  const invitation = getPilotInviteAuthorization();
  if (!privacy || !invitation || !pilotPrivacyIsReady(action.reviewDate)) {
    return null;
  }
  return JSON.stringify({
    version: 1,
    action: {
      title: action.title,
      intendedOutput: action.intendedOutput,
      whyItMatters: action.whyItMatters,
      timeSize: action.timeSize,
      compensation: action.compensation,
      responseQuestions: action.responseQuestions,
      responsePath: action.responsePath,
      skillsNeeded: action.skillsNeeded,
      locationMode: action.locationMode,
      ownerName: action.ownerName,
      reviewerName: action.reviewerName,
      capacity: action.capacity,
      evidenceRequired: action.evidenceRequired,
      reviewDate: action.reviewDate,
      stopCondition: action.stopCondition,
    },
    privacy,
    invitation,
  });
}

export function pilotTermsAreApproved(action: PilotApprovalTerms): boolean {
  const current = getCurrentPilotApprovalSnapshot(action);
  return pilotApprovalSnapshotIsCurrent(
    action.pilotTermsApprovedAt,
    action.pilotApprovalSnapshot,
    current,
  );
}

export function pilotRuntimeIsReady(
  action: PilotApprovalTerms,
  retentionSweep: AdminRetentionSweep | null,
  now = new Date(),
): boolean {
  return (
    pilotPrivacyIsReady(action.reviewDate) &&
    pilotInvitesAreAuthorized() &&
    pilotTermsAreApproved(action) &&
    !publicIntakeIsOpen() &&
    retentionHeartbeatIsRecent(retentionSweep, now)
  );
}
