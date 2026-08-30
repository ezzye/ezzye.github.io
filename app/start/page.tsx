import type { Metadata } from 'next';
import {
  AlertTriangle,
  EyeOff,
  FileCheck2,
  HeartHandshake,
} from 'lucide-react';

import { ProposalForm } from '@/components/proposal-form';
import { SiteShell } from '@/components/site-shell';

export const metadata: Metadata = {
  title: 'Bring a barrier',
  description:
    'Privately propose one repeatable unfair process for a bounded repair.',
};

export default function StartPage() {
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">Private intake</p>
        <h1>Bring a barrier, not a campaign.</h1>
        <p>
          Describe one repeatable process, who bears its cost and the smallest
          change worth testing. Your submission is private by default.
        </p>
      </header>

      <section
        className="page-section boundary-grid"
        aria-label="Before you begin"
      >
        <article>
          <EyeOff aria-hidden="true" />
          <h2>Private first</h2>
          <p>
            Nothing becomes public from this form. A redacted draft requires a
            separate preview and your approval.
          </p>
        </article>
        <article>
          <FileCheck2 aria-hidden="true" />
          <h2>Process, not allegation</h2>
          <p>
            Do not name private people or send case numbers, medical records,
            passwords, witness statements or files.
          </p>
        </article>
        <article>
          <HeartHandshake aria-hidden="true" />
          <h2>Small and adoptable</h2>
          <p>
            A useful proposal has an affected-person perspective and someone
            able to adopt or test the change.
          </p>
        </article>
        <article className="urgent-boundary">
          <AlertTriangle aria-hidden="true" />
          <h2>Not an urgent channel</h2>
          <p>
            This is not emergency support, legal advice, safeguarding casework
            or a confidential whistleblowing service.
          </p>
        </article>
      </section>

      <section
        className="page-section form-section"
        aria-labelledby="proposal-title"
      >
        <div className="section-heading">
          <p className="eyebrow">Proposal form</p>
          <h2 id="proposal-title">
            Give the workshop something it can repair.
          </h2>
          <p>
            Fields are deliberately structured so a difficult experience can
            become a fair test without becoming outrage content.
          </p>
        </div>
        <ProposalForm />
      </section>
    </SiteShell>
  );
}
