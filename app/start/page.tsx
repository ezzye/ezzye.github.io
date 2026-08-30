import type { Metadata } from 'next';
import {
  AlertTriangle,
  EyeOff,
  FileCheck2,
  HeartHandshake,
} from 'lucide-react';

import { ProposalForm } from '@/components/proposal-form';
import { SiteShell } from '@/components/site-shell';
import { publicIntakeIsOpen } from '@/lib/public-intake';

export const metadata: Metadata = {
  title: 'How to tell us what went wrong',
  description:
    'See how the planned private form will work and what not to send.',
};
export const dynamic = 'force-dynamic';

export default function StartPage() {
  const isOpen = publicIntakeIsOpen();
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">
          {isOpen ? 'Tell us in private' : 'How this will work'}
        </p>
        <h1>
          {isOpen
            ? 'Tell us about one unfair thing.'
            : 'This private form is not open yet.'}
        </h1>
        <p>
          {isOpen
            ? 'Tell us what keeps going wrong. We will read it in private. A public draft with names and private details removed needs your separate permission and review.'
            : 'When it opens, you will be able to tell us about one bad rule, form or service. Please do not send private case details now.'}
        </p>
      </header>

      <section
        className="page-section boundary-grid"
        aria-label={isOpen ? 'Before you begin' : 'Rules for the future form'}
      >
        <article>
          <EyeOff aria-hidden="true" />
          <h2>{isOpen ? 'We keep it private' : 'It must stay private'}</h2>
          <p>
            {isOpen
              ? 'What you type here is not posted. If we write a page, you see it first and can say yes or no.'
              : 'What a person sends must not be posted. If a page is later drafted, the sender must see it first and say yes or no.'}
          </p>
        </article>
        <article>
          <FileCheck2 aria-hidden="true" />
          <h2>Leave out names and files</h2>
          <p>
            {isOpen
              ? 'Do not send names, case numbers, health records, passwords, witness notes or private files.'
              : 'When it opens, do not send names, case numbers, health records, passwords, witness notes or private files.'}
          </p>
        </article>
        <article>
          <HeartHandshake aria-hidden="true" />
          <h2>
            {isOpen ? 'Tell us one thing' : 'It will ask about one thing'}
          </h2>
          <p>
            {isOpen
              ? 'Tell us what goes wrong, who it hurts and one small change that may help.'
              : 'It will ask what goes wrong, who it hurts and one small change that may help.'}
          </p>
        </article>
        <article className="urgent-boundary">
          <AlertTriangle aria-hidden="true" />
          <h2>Not for danger or legal help</h2>
          <p>
            Even when it opens, we cannot help in an emergency. We do not give
            legal advice, run safety cases or take whistleblowing reports.
          </p>
        </article>
      </section>

      <section
        className="page-section form-section"
        aria-labelledby="proposal-title"
      >
        <div className="section-heading">
          <p className="eyebrow">{isOpen ? 'The form' : 'The future form'}</p>
          <h2 id="proposal-title">
            {isOpen ? 'Tell us what happened.' : 'What it will ask.'}
          </h2>
          <p>
            {isOpen
              ? 'Short is fine. Plain words are best.'
              : 'One problem, who it hurts and one small change that may help.'}
          </p>
        </div>
        {isOpen ? (
          <ProposalForm />
        ) : (
          <output className="intake-closed">
            <h3>This form is not open yet.</h3>
            <p>
              We are checking the privacy and reply process first. Please do not
              send private case details.
            </p>
          </output>
        )}
      </section>
    </SiteShell>
  );
}
