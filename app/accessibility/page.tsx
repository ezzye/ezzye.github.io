import type { Metadata } from 'next';

import { SiteShell } from '@/components/site-shell';

export const metadata: Metadata = {
  title: 'Accessibility',
  description:
    'The phase-one accessibility standard and how to report a barrier.',
};

export default function AccessibilityPage() {
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">Access is part of fairness</p>
        <h1>Accessibility statement</h1>
        <p>
          The phase-one site aims to work with a keyboard, screen magnification,
          reduced motion and common screen readers, using plain language and
          visible focus throughout.
        </p>
      </header>
      <section className="page-section prose-page">
        <h2>Current standard</h2>
        <p>
          We are targeting WCAG 2.2 AA, with semantic headings, labelled
          controls, error summaries, no colour-only status and layouts that
          reflow on small screens and at 200% zoom. A claim of conformance
          requires independent testing; phase one does not make that claim yet.
        </p>
        <h2>Known limits</h2>
        <p>
          The site has not yet completed testing with affected users or a full
          screen-reader matrix. The historical archive may not meet the current
          standard. External evidence links are outside our control.
        </p>
        <h2>Report a barrier</h2>
        <p>
          Use the corrections and appeals form and choose “Accessibility
          problem”. Include the page, browser or assistive technology if you are
          comfortable. You do not need to disclose a diagnosis.
        </p>
      </section>
    </SiteShell>
  );
}
