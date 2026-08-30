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
  title: 'Tell us what went wrong',
  description:
    'Tell us in private about one form, rule or service that keeps going wrong.',
};

export default function StartPage() {
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">Tell us in private</p>
        <h1>Tell us about one unfair thing.</h1>
        <p>
          Tell us what keeps going wrong. We will read it in private. Nothing
          goes on the site until you see it and say yes.
        </p>
      </header>

      <section
        className="page-section boundary-grid"
        aria-label="Before you begin"
      >
        <article>
          <EyeOff aria-hidden="true" />
          <h2>We keep it private</h2>
          <p>
            What you type here is not posted. If we write a page, you see it
            first and can say yes or no.
          </p>
        </article>
        <article>
          <FileCheck2 aria-hidden="true" />
          <h2>Leave out names and files</h2>
          <p>
            Do not send names, case numbers, health records, passwords, witness
            notes or private files.
          </p>
        </article>
        <article>
          <HeartHandshake aria-hidden="true" />
          <h2>Tell us one thing</h2>
          <p>
            Tell us what goes wrong, who it hurts and one small change that may
            help.
          </p>
        </article>
        <article className="urgent-boundary">
          <AlertTriangle aria-hidden="true" />
          <h2>Not for danger or legal help</h2>
          <p>
            We cannot help in an emergency. We do not give legal advice, run
            safety cases or take whistleblowing reports.
          </p>
        </article>
      </section>

      <section
        className="page-section form-section"
        aria-labelledby="proposal-title"
      >
        <div className="section-heading">
          <p className="eyebrow">The form</p>
          <h2 id="proposal-title">Tell us what happened.</h2>
          <p>Short is fine. Plain words are best.</p>
        </div>
        <ProposalForm />
      </section>
    </SiteShell>
  );
}
