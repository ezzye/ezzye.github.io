import type { RepairBundle } from '@/lib/types';

export const demoBundle: RepairBundle = {
  repair: {
    id: 'CFJ-R001',
    slug: 'public-consultation',
    title: 'Make a council web page easier to read',
    summary:
      'A made-up council page hides three key facts: what may change, the last day to reply and where to send a reply.',
    stage: 'acting',
    scope:
      'This is a made-up council page. It is here to show how the site works. It is not about a real town or person.',
    affectedGroups:
      'People who find long official pages hard to read, use a phone, need more time or have trouble with dense words.',
    knownFacts:
      'A reader needs to find three things: what may change, the last day to reply and where to send a reply.',
    unknowns:
      'We do not know if a short guide would help more people reply to a real council page.',
    disputedClaims:
      'There is no real council or claim to argue about. The whole page is made up.',
    desiredChange: 'A reader can find all three key facts without help.',
    smallestTest:
      'Write a short guide. Ask five people if they can find the three key facts.',
    safeguards:
      'Use no names or private facts. Name no real council. Stop if any real person can be known from the page.',
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
      title: 'Read the guide and mark what is hard to follow',
      intendedOutput:
        'Write down the three key facts and mark one bit that is hard to follow.',
      whyItMatters:
        'The guide must make sense to a reader, not just to the person who wrote it.',
      timeSize: '20 minutes',
      skillsNeeded: 'Careful reading. No expert skill needed.',
      locationMode: 'At home',
      ownerName: 'Guide writer',
      reviewerName: 'Access checker',
      capacity: 2,
      status: 'ready',
      evidenceRequired: 'Three short answers with no names or private facts.',
      reviewDate: '2026-09-06',
      stopCondition:
        'Stop after two clear replies, or if the made-up page changes.',
      sortOrder: 1,
    },
    {
      id: 'CFJ-A002',
      repairId: 'CFJ-R001',
      title: 'Try it with a keyboard and text twice the size',
      intendedOutput:
        'Say what works and what breaks when you use only a keyboard and make the text twice as big.',
      whyItMatters:
        'Clear words do not help if the page itself is hard to use.',
      timeSize: '1 hour',
      skillsNeeded: 'Accessibility testing',
      locationMode: 'At home',
      ownerName: 'Site maker',
      reviewerName: 'A second access checker',
      capacity: 1,
      status: 'doing',
      evidenceRequired: 'Name the browser and say what worked or broke.',
      reviewDate: '2026-09-06',
      stopCondition:
        'Stop if the page cannot be used. Fix that fault before doing more.',
      sortOrder: 2,
    },
    {
      id: 'CFJ-A003',
      repairId: 'CFJ-R001',
      title: 'Plan a safe test with a real group',
      intendedOutput:
        'One page that says who takes part, what they agree to, what success means and when to stop.',
      whyItMatters:
        'A made-up test cannot prove that the idea works for real people.',
      timeSize: 'Half-day',
      skillsNeeded: 'Planning a fair test with people',
      locationMode: 'At home',
      ownerName: 'Test lead',
      reviewerName: 'A person from the group',
      capacity: 2,
      status: 'ready',
      evidenceRequired:
        'The group and the person who checks the test both say yes.',
      reviewDate: '2026-09-13',
      stopCondition:
        'Stop if no group will use the result, or if the test needs private case files.',
      sortOrder: 3,
    },
  ],
  outcomes: [
    {
      id: 'CFJ-O001',
      repairId: 'CFJ-R001',
      repairSlug: 'public-consultation',
      repairTitle: 'Make a council web page easier to read',
      repairIsDemo: true,
      title: 'In the made-up test, putting the date first worked better',
      activity:
        'We made five pretend reader notes and used them to check the guide.',
      observedEffect:
        'Four found all three facts. One missed the last day to reply until we put it in the first paragraph.',
      evidence:
        'This was made up. No real people took part, so it proves nothing about a real council page.',
      evidenceUrl: null,
      confidence: 'claimed',
      verifierName: 'Coding for Justice made-up test',
      whoBenefited: 'Only the pretend readers in the example.',
      whatDidNotChange:
        'We do not know if the guide would help more real people reply or change a real choice.',
      learning:
        'Doing a task is not the same as helping people. A real test needs real readers who say yes and a group that will use the result.',
      publishedAt: '2026-08-30T09:00:00.000Z',
      sortOrder: 1,
    },
  ],
  updates: [
    {
      id: 'CFJ-U001',
      repairId: 'CFJ-R001',
      title: 'The made-up page is ready to check',
      body: 'The made-up council page and short guide are ready. The next step is for a person to check the words and the page.',
      evidenceChanged:
        'The example now says what it covers, what we saw and when to stop.',
      remainsUnfair: 'No real form, rule or service has been fixed yet.',
      nextOwner: 'Guide writer',
      nextReviewDate: '2026-09-06',
      publishedAt: '2026-08-30T09:00:00.000Z',
    },
  ],
};
