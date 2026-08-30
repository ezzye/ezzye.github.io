import type { Metadata } from 'next';

import { SiteShell } from '@/components/site-shell';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'How Coding for Justice handles proposals, contribution offers and review requests.',
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">Privacy boundary · phase one</p>
        <h1>Private intake is not public content.</h1>
        <p>
          The site collects only what the workshop needs to consider a proposal,
          contact a contributor or review a decision. There are no public
          accounts, comments, trackers or uploads in phase one.
        </p>
      </header>
      <section className="page-section prose-page">
        <h2>What is collected</h2>
        <p>
          Proposal text, optional contact and access details, contribution
          offers, correction or appeal requests, consent choices, workflow
          status and a privacy-preserving rate-limit record. Do not send case
          numbers, passwords, medical records, witness evidence or other
          sensitive files.
        </p>
        <h2>Why it is used</h2>
        <p>
          To triage a repeatable barrier, prepare a separately redacted draft,
          coordinate a bounded action, respond to a review request and prevent
          spam. Public repair pages contain only material that has passed human
          review.
        </p>
        <h2>Publication and AI</h2>
        <p>
          A private form submission never publishes automatically. A redacted
          public draft requires a separate preview and approval. AI assistance
          is off by default for submissions; consent to a named provider and
          purpose must be obtained before private material is transferred.
        </p>
        <h2>Retention</h2>
        <p>
          Declined or abandoned private submissions should be deleted within 90
          days of the final review. Accepted work may be retained for up to 12
          months after closure, then reviewed for deletion or irreversible
          anonymisation. Published evidence and correction records remain while
          they are needed for accountability. These periods are an operating
          commitment for phase one and must be revisited with a real partner.
        </p>
        <h2>Your choices</h2>
        <p>
          You can request access, correction, withdrawal, restricted use or
          deletion through the corrections and appeals route. Safety, legal and
          record-integrity duties may limit deletion in some circumstances; the
          decision and reason should be explained.
        </p>
        <h2>Before a real pilot</h2>
        <p>
          A named data controller, contact route, lawful-basis assessment,
          processor list, cookie check and UK GDPR privacy notice must be
          approved before inviting real sensitive case material. Phase one is
          designed to avoid collecting that material at all.
        </p>
      </section>
    </SiteShell>
  );
}
