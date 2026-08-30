import type { RepairBundle } from '@/lib/types';

export const demoBundle: RepairBundle = {
  repair: {
    id: 'CFJ-R001',
    slug: 'public-consultation',
    title: 'Make one public consultation easier to understand',
    summary:
      'Test whether a 250-word plain-language guide helps readers find the proposed decision, deadline and response route without assistance.',
    stage: 'acting',
    scope:
      'A fictional council consultation notice created only to demonstrate the repair process. It does not describe a real authority, policy or resident.',
    affectedGroups:
      'Adults who may face dense official language, limited time, cognitive load, low digital confidence or communication barriers.',
    knownFacts:
      'A consultation response requires a reader to identify what may change, the deadline and how to respond.',
    unknowns:
      'Whether a plain-language guide changes real participation, trust or decision quality.',
    disputedClaims:
      'There are no disputed claims about a real institution because the notice and test records are fictional.',
    desiredChange:
      'A reader can identify the decision, deadline and response route without assistance.',
    smallestTest:
      'Create a 250-word guide and test it with five consenting adult readers.',
    safeguards:
      'No personal data; no real authority; demonstration label on every page; stop if test material contains identifiable information.',
    ownerName: 'Coding for Justice',
    partnerName: null,
    reviewDate: '2026-09-13',
    updatedAt: '2026-08-30T09:00:00.000Z',
    isDemo: true,
  },
  actions: [
    {
      id: 'CFJ-A001',
      repairId: 'CFJ-R001',
      title: 'Review the 250-word guide',
      intendedOutput:
        'A short response identifying the proposed decision, deadline and response route, plus one confusing phrase.',
      whyItMatters:
        'The repair must work for readers rather than only for its author.',
      timeSize: '20 minutes',
      skillsNeeded: 'Careful reading; no specialist knowledge',
      locationMode: 'Remote',
      ownerName: 'Workshop editor',
      reviewerName: 'Accessibility reviewer',
      capacity: 2,
      status: 'ready',
      evidenceRequired:
        'Completed three-question review with no personal information.',
      reviewDate: '2026-09-06',
      stopCondition:
        'Stop when two suitable reviews are accepted or if the source notice changes.',
      sortOrder: 1,
    },
    {
      id: 'CFJ-A002',
      repairId: 'CFJ-R001',
      title: 'Check keyboard and 200% zoom use',
      intendedOutput:
        'A pass or failure note for keyboard order, focus visibility, reflow and text enlargement.',
      whyItMatters:
        'Plain language is not useful if the interface itself excludes people.',
      timeSize: '1 hour',
      skillsNeeded: 'Accessibility testing',
      locationMode: 'Remote',
      ownerName: 'Workshop developer',
      reviewerName: 'Independent accessibility reviewer',
      capacity: 1,
      status: 'doing',
      evidenceRequired: 'Browser, viewport and observed result for each check.',
      reviewDate: '2026-09-06',
      stopCondition:
        'Stop and repair immediately if a blocking accessibility defect is found.',
      sortOrder: 2,
    },
    {
      id: 'CFJ-A003',
      repairId: 'CFJ-R001',
      title: 'Design the real partner test',
      intendedOutput:
        'A one-page protocol with consent, baseline, success measure and stop rule.',
      whyItMatters:
        'The fictional demonstration must not be mistaken for evidence that the method works in public life.',
      timeSize: 'Half-day',
      skillsNeeded: 'Research design or service design',
      locationMode: 'Remote',
      ownerName: 'Workshop lead',
      reviewerName: 'Affected-person reviewer',
      capacity: 2,
      status: 'ready',
      evidenceRequired:
        'Protocol approved by a partner and affected-person reviewer.',
      reviewDate: '2026-09-13',
      stopCondition:
        'Stop if there is no adoption owner or the test would require sensitive case data.',
      sortOrder: 3,
    },
  ],
  outcomes: [
    {
      id: 'CFJ-O001',
      repairId: 'CFJ-R001',
      repairSlug: 'public-consultation',
      repairTitle: 'Make one public consultation easier to understand',
      title: 'The deadline needed to move',
      activity:
        'Five fictional reader records were created to test the demonstration guide.',
      observedEffect:
        'Four records found all three facts; one missed the deadline until it was moved into the opening paragraph.',
      evidence:
        'Demonstration records only. No real people participated and no claim about public participation can be made.',
      evidenceUrl: null,
      confidence: 'claimed',
      verifierName: 'Coding for Justice demonstration',
      whoBenefited: 'The fictional readers represented by the test scenarios.',
      whatDidNotChange:
        'There is no evidence that the guide increases real consultation participation or changes an institutional decision.',
      learning:
        'Completed activity is not the same as demonstrated social effect. The real pilot needs consenting readers, a baseline and an external owner.',
      publishedAt: '2026-08-30T09:00:00.000Z',
      sortOrder: 1,
    },
  ],
  updates: [
    {
      id: 'CFJ-U001',
      repairId: 'CFJ-R001',
      title: 'The workshop is open for a bounded review',
      body: 'The fictional notice, guide and initial test record are ready. The next step is a human review of the wording and interface.',
      evidenceChanged:
        'The demonstration now has an explicit scope, evidence label and stop condition.',
      remainsUnfair: 'No real public-service process has yet been repaired.',
      nextOwner: 'Workshop editor',
      nextReviewDate: '2026-09-06',
      publishedAt: '2026-08-30T09:00:00.000Z',
    },
  ],
};
