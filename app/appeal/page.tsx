import type { Metadata } from 'next';

import { AppealForm } from '@/components/appeal-form';
import { formatDate } from '@/components/repair-card';
import { SiteShell } from '@/components/site-shell';
import { getPublishedCorrections } from '@/db/queries';
import { publicIntakeIsOpen } from '@/lib/public-intake';

export const metadata: Metadata = {
  title: 'How to ask us to fix a mistake',
  description:
    'See how the planned review form and correction process will work.',
};
export const dynamic = 'force-dynamic';

export default async function AppealPage() {
  const corrections = await getPublishedCorrections();
  const isOpen = publicIntakeIsOpen();
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">
          {isOpen ? 'We can get things wrong' : 'How review will work'}
        </p>
        <h1>
          {isOpen
            ? 'Ask us to fix a mistake.'
            : 'This review form is not open yet.'}
        </h1>
        <p>
          {isOpen
            ? 'Tell us which page or choice is wrong. We will record who checks it and whether they were involved the first time.'
            : 'When it is staffed, you will be able to ask for a fact fix, privacy removal, accessibility fix or a check of a decision to remove or limit something.'}
        </p>
      </header>

      <section
        className="page-section review-standard"
        aria-labelledby="standard-title"
      >
        <div className="section-heading">
          <p className="eyebrow">The standard</p>
          <h2 id="standard-title">
            {isOpen ? 'How we check it.' : 'How an open review must work.'}
          </h2>
        </div>
        <ol>
          <li>
            {isOpen
              ? 'We remove exposed private information first when we can.'
              : 'A staffed review must remove exposed private information first when it can.'}
          </li>
          <li>
            {isOpen
              ? 'We write down why we made the first choice.'
              : 'The reviewer must write down why the first choice was made.'}
          </li>
          <li>
            {isOpen
              ? 'We record whether a different person checked it. If nobody else is available, we say that plainly.'
              : 'The record must say whether a different person checked it. If nobody else is available, it must say so.'}
          </li>
          <li>
            {isOpen
              ? 'We say what was chosen and why.'
              : 'When the route opens, the result must say what was chosen and why.'}
          </li>
        </ol>
      </section>

      <section
        className="page-section form-section"
        aria-labelledby="appeal-form-title"
      >
        <div className="section-heading">
          <p className="eyebrow">{isOpen ? 'Private form' : 'Future form'}</p>
          <h2 id="appeal-form-title">
            {isOpen ? 'What do we need to look at?' : 'What it will ask.'}
          </h2>
        </div>
        {isOpen ? (
          <AppealForm />
        ) : (
          <output className="intake-closed">
            <h3>This form is not open yet.</h3>
            <p>
              We are checking the privacy and review process first. No request
              can be sent from this page yet.
            </p>
          </output>
        )}
      </section>

      <section
        className="page-section corrections-section"
        aria-labelledby="corrections-title"
      >
        <div className="section-heading">
          <p className="eyebrow">Mistakes we fixed</p>
          <h2 id="corrections-title">Public list</h2>
        </div>
        {corrections.length === 0 ? (
          <p className="empty-ledger">
            No public corrections have been recorded.
          </p>
        ) : (
          <ol className="correction-list">
            {corrections.map((correction) => (
              <li key={correction.id}>
                <p className="mini-label">{formatDate(correction.changedAt)}</p>
                <h3>{correction.itemReference}</h3>
                <p>{correction.summary}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </SiteShell>
  );
}
