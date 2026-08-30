import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const repairs = sqliteTable(
  'repairs',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    stage: text('stage', {
      enum: ['listening', 'framing', 'acting', 'checking', 'closed', 'stopped'],
    }).notNull(),
    scope: text('scope').notNull(),
    affectedGroups: text('affected_groups').notNull(),
    knownFacts: text('known_facts').notNull(),
    unknowns: text('unknowns').notNull(),
    disputedClaims: text('disputed_claims').notNull(),
    desiredChange: text('desired_change').notNull(),
    smallestTest: text('smallest_test').notNull(),
    safeguards: text('safeguards').notNull(),
    ownerName: text('owner_name').notNull(),
    partnerName: text('partner_name'),
    reviewDate: text('review_date').notNull(),
    updatedAt: text('updated_at').notNull(),
    isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
    isPublished: integer('is_published', { mode: 'boolean' })
      .notNull()
      .default(false),
  },
  (table) => [
    uniqueIndex('idx_repairs_slug').on(table.slug),
    index('idx_repairs_public_stage').on(table.isPublished, table.stage),
  ],
);

export const actionCards = sqliteTable(
  'action_cards',
  {
    id: text('id').primaryKey(),
    repairId: text('repair_id')
      .notNull()
      .references(() => repairs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    intendedOutput: text('intended_output').notNull(),
    whyItMatters: text('why_it_matters').notNull(),
    timeSize: text('time_size').notNull(),
    skillsNeeded: text('skills_needed').notNull(),
    locationMode: text('location_mode').notNull(),
    ownerName: text('owner_name').notNull(),
    reviewerName: text('reviewer_name').notNull(),
    capacity: integer('capacity').notNull(),
    status: text('status', {
      enum: [
        'ready',
        'offered',
        'assigned',
        'doing',
        'review',
        'verified',
        'blocked',
        'stopped',
      ],
    }).notNull(),
    evidenceRequired: text('evidence_required').notNull(),
    reviewDate: text('review_date').notNull(),
    stopCondition: text('stop_condition').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    index('idx_actions_repair_sort').on(table.repairId, table.sortOrder),
    index('idx_actions_status').on(table.status),
  ],
);

export const outcomes = sqliteTable(
  'outcomes',
  {
    id: text('id').primaryKey(),
    repairId: text('repair_id')
      .notNull()
      .references(() => repairs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    activity: text('activity').notNull(),
    observedEffect: text('observed_effect').notNull(),
    evidence: text('evidence').notNull(),
    evidenceUrl: text('evidence_url'),
    confidence: text('confidence', {
      enum: ['claimed', 'observed', 'independently_verified'],
    }).notNull(),
    verifierName: text('verifier_name').notNull(),
    whoBenefited: text('who_benefited').notNull(),
    whatDidNotChange: text('what_did_not_change').notNull(),
    learning: text('learning').notNull(),
    publishedAt: text('published_at').notNull(),
    isPublished: integer('is_published', { mode: 'boolean' })
      .notNull()
      .default(false),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    index('idx_outcomes_repair_sort').on(table.repairId, table.sortOrder),
    index('idx_outcomes_public_date').on(table.isPublished, table.publishedAt),
  ],
);

export const repairUpdates = sqliteTable(
  'repair_updates',
  {
    id: text('id').primaryKey(),
    repairId: text('repair_id')
      .notNull()
      .references(() => repairs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    evidenceChanged: text('evidence_changed').notNull(),
    remainsUnfair: text('remains_unfair').notNull(),
    nextOwner: text('next_owner').notNull(),
    nextReviewDate: text('next_review_date').notNull(),
    publishedAt: text('published_at').notNull(),
    isPublished: integer('is_published', { mode: 'boolean' })
      .notNull()
      .default(false),
  },
  (table) => [
    index('idx_updates_repair_date').on(table.repairId, table.publishedAt),
  ],
);

export const stewardBriefs = sqliteTable(
  'steward_briefs',
  {
    id: text('id').primaryKey(),
    repairId: text('repair_id')
      .notNull()
      .references(() => repairs.id, { onDelete: 'cascade' }),
    sourceChecksum: text('source_checksum').notNull(),
    summary: text('summary').notNull(),
    nextAction: text('next_action').notNull(),
    blockers: text('blockers').notNull(),
    draftUpdate: text('draft_update').notNull(),
    questions: text('questions').notNull(),
    model: text('model').notNull(),
    status: text('status', { enum: ['draft', 'adopted', 'discarded'] })
      .notNull()
      .default('draft'),
    generatedAt: text('generated_at').notNull(),
    reviewedAt: text('reviewed_at'),
  },
  (table) => [
    index('idx_steward_repair_date').on(table.repairId, table.generatedAt),
    index('idx_steward_status').on(table.status),
  ],
);

export const proposals = sqliteTable(
  'proposals',
  {
    id: text('id').primaryKey(),
    workingTitle: text('working_title').notNull(),
    problem: text('problem').notNull(),
    broadLocation: text('broad_location'),
    affectedGroups: text('affected_groups').notNull(),
    evidenceState: text('evidence_state').notNull(),
    sourceLinks: text('source_links').notNull(),
    desiredChange: text('desired_change').notNull(),
    firstStep: text('first_step').notNull(),
    helpNeeded: text('help_needed').notNull(),
    relationship: text('relationship').notNull(),
    chosenName: text('chosen_name'),
    email: text('email'),
    contactPreference: text('contact_preference'),
    accessibilityNeed: text('accessibility_need'),
    privacyConcern: text('privacy_concern'),
    consentContact: integer('consent_contact', { mode: 'boolean' })
      .notNull()
      .default(false),
    consentRedactedDraft: integer('consent_redacted_draft', { mode: 'boolean' })
      .notNull()
      .default(false),
    backgroundOnly: integer('background_only', { mode: 'boolean' })
      .notNull()
      .default(true),
    consentCredit: integer('consent_credit', { mode: 'boolean' })
      .notNull()
      .default(false),
    consentAi: integer('consent_ai', { mode: 'boolean' })
      .notNull()
      .default(false),
    status: text('status', {
      enum: [
        'new',
        'reviewing',
        'needs_information',
        'declined',
        'accepted',
        'deleted',
      ],
    }).notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_proposals_status_date').on(table.status, table.createdAt),
    index('idx_proposals_email').on(table.email),
  ],
);

export const actionOffers = sqliteTable(
  'action_offers',
  {
    id: text('id').primaryKey(),
    actionId: text('action_id')
      .notNull()
      .references(() => actionCards.id, { onDelete: 'cascade' }),
    chosenName: text('chosen_name').notNull(),
    email: text('email').notNull(),
    contribution: text('contribution').notNull(),
    accessibilityNeed: text('accessibility_need'),
    covenantVersion: text('covenant_version').notNull(),
    consentContact: integer('consent_contact', { mode: 'boolean' })
      .notNull()
      .default(false),
    status: text('status', {
      enum: ['new', 'contacted', 'assigned', 'declined', 'closed'],
    }).notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_offers_action_status').on(table.actionId, table.status),
  ],
);

export const appeals = sqliteTable(
  'appeals',
  {
    id: text('id').primaryKey(),
    itemReference: text('item_reference').notNull(),
    requestType: text('request_type').notNull(),
    explanation: text('explanation').notNull(),
    evidenceLinks: text('evidence_links').notNull(),
    email: text('email').notNull(),
    accessibilityNeed: text('accessibility_need'),
    status: text('status', {
      enum: ['new', 'reviewing', 'resolved', 'declined'],
    }).notNull(),
    reviewerId: text('reviewer_id'),
    decisionNote: text('decision_note'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_appeals_status_date').on(table.status, table.createdAt),
  ],
);

export const corrections = sqliteTable(
  'corrections',
  {
    id: text('id').primaryKey(),
    repairId: text('repair_id').references(() => repairs.id, {
      onDelete: 'set null',
    }),
    itemReference: text('item_reference').notNull(),
    summary: text('summary').notNull(),
    changedAt: text('changed_at').notNull(),
    isPublished: integer('is_published', { mode: 'boolean' })
      .notNull()
      .default(false),
  },
  (table) => [
    index('idx_corrections_public_date').on(table.isPublished, table.changedAt),
  ],
);

export const rateLimits = sqliteTable(
  'rate_limits',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull(),
    resetAt: integer('reset_at').notNull(),
  },
  (table) => [index('idx_rate_limits_reset').on(table.resetAt)],
);
