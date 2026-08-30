export type RepairStage =
  | 'listening'
  | 'framing'
  | 'acting'
  | 'checking'
  | 'closed'
  | 'stopped';

export type ActionStatus =
  | 'ready'
  | 'offered'
  | 'assigned'
  | 'doing'
  | 'review'
  | 'verified'
  | 'blocked'
  | 'stopped';

export type OutcomeConfidence =
  | 'claimed'
  | 'observed'
  | 'independently_verified';

export type Repair = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  stage: RepairStage;
  scope: string;
  affectedGroups: string;
  knownFacts: string;
  unknowns: string;
  disputedClaims: string;
  desiredChange: string;
  smallestTest: string;
  safeguards: string;
  ownerName: string;
  partnerName: string | null;
  reviewDate: string;
  updatedAt: string;
  isDemo: boolean;
};

export type ActionCard = {
  id: string;
  repairId: string;
  title: string;
  intendedOutput: string;
  whyItMatters: string;
  timeSize: string;
  skillsNeeded: string;
  locationMode: string;
  ownerName: string;
  reviewerName: string;
  capacity: number;
  status: ActionStatus;
  evidenceRequired: string;
  reviewDate: string;
  stopCondition: string;
  sortOrder: number;
};

export type Outcome = {
  id: string;
  repairId: string;
  repairSlug?: string;
  repairTitle?: string;
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
  publishedAt: string;
  sortOrder: number;
};

export type RepairUpdate = {
  id: string;
  repairId: string;
  title: string;
  body: string;
  evidenceChanged: string;
  remainsUnfair: string;
  nextOwner: string;
  nextReviewDate: string;
  publishedAt: string;
};

export type Correction = {
  id: string;
  itemReference: string;
  summary: string;
  changedAt: string;
};

export type RepairBundle = {
  repair: Repair;
  actions: ActionCard[];
  outcomes: Outcome[];
  updates: RepairUpdate[];
};

export type ProposalInput = {
  workingTitle: string;
  problem: string;
  broadLocation: string | null;
  affectedGroups: string;
  evidenceState: string;
  sourceLinks: string;
  desiredChange: string;
  firstStep: string;
  helpNeeded: string;
  relationship: string;
  chosenName: string | null;
  email: string | null;
  contactPreference: string | null;
  accessibilityNeed: string | null;
  privacyConcern: string | null;
  consentContact: boolean;
  consentRedactedDraft: boolean;
  backgroundOnly: boolean;
  consentCredit: boolean;
  consentAi: boolean;
};

export type ActionOfferInput = {
  actionId: string;
  chosenName: string;
  email: string;
  contribution: string;
  accessibilityNeed: string | null;
  covenantVersion: string;
  consentContact: boolean;
};

export type AppealInput = {
  itemReference: string;
  requestType: string;
  explanation: string;
  evidenceLinks: string;
  email: string;
  accessibilityNeed: string | null;
};

export type AdminProposal = ProposalInput & {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminAppeal = AppealInput & {
  id: string;
  status: string;
  reviewerId: string | null;
  decisionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StewardBrief = {
  id: string;
  repairId: string;
  sourceChecksum: string;
  summary: string;
  nextAction: string;
  blockers: string[];
  draftUpdate: string;
  questions: string[];
  model: string;
  status: 'draft' | 'adopted' | 'discarded';
  generatedAt: string;
  reviewedAt: string | null;
};
