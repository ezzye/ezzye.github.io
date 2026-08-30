import type { Metadata } from 'next';

import { SiteShell } from '@/components/site-shell';
import { getPublicContactEmail } from '@/lib/public-intake';

export const metadata: Metadata = {
  title: 'Help with access',
  description:
    'How we are making this site easier to use and how to tell us when it is not.',
};
export const dynamic = 'force-dynamic';

export default function AccessibilityPage() {
  const contactEmail = getPublicContactEmail();
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">Help with access</p>
        <h1>This site should be easy to read and use.</h1>
        <p>
          It should work with a keyboard, big text and a screen reader. It
          should also use short, plain words. We are still testing it.
        </p>
      </header>
      <section className="page-section prose-page">
        <h2>What we aim for</h2>
        <p>
          We aim to meet WCAG 2.2 AA. That means clear headings, named buttons,
          useful error messages and pages that still work on a small screen or
          with text twice the size. We cannot claim that yet. Someone outside
          the project still needs to check it.
        </p>
        <h2>What we have not done yet</h2>
        <p>
          We have not yet tested the whole site with disabled people or every
          common screen reader. The old site and other sites we link to may be
          harder to use.
        </p>
        <h2>Tell us what is hard</h2>
        {contactEmail ? (
          <p>
            Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Tell
            us which page went wrong and what made it hard to use. You do not
            need to tell us a diagnosis.
          </p>
        ) : (
          <p>
            The feedback form is not open yet. Please do not send private case
            details. A public contact address will appear here before the site
            asks anyone for feedback.
          </p>
        )}
      </section>
    </SiteShell>
  );
}
