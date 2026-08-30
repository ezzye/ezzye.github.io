import type { Metadata } from 'next';

import { AppealForm } from '@/components/appeal-form';
import { formatDate } from '@/components/repair-card';
import { SiteShell } from '@/components/site-shell';
import { getPublishedCorrections } from '@/db/queries';

export const metadata: Metadata = {
  title: 'Ask us to fix a mistake',
  description:
    'Ask for a factual correction, privacy removal, accessibility fix or moderation review.',
};
export const dynamic = 'force-dynamic';

export default async function AppealPage() {
  const corrections = await getPublishedCorrections();
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">We can get things wrong</p>
        <h1>Ask us to fix a mistake.</h1>
        <p>
          Tell us which page or choice is wrong. Someone who did not make the
          first choice should look at it.
        </p>
      </header>

      <section
        className="page-section review-standard"
        aria-labelledby="standard-title"
      >
        <div className="section-heading">
          <p className="eyebrow">What happens next</p>
          <h2 id="standard-title">A second person checks it.</h2>
        </div>
        <ol>
          <li>We look at urgent safety or privacy risks first.</li>
          <li>We write down why we made the first choice.</li>
          <li>A different person checks your request and the proof.</li>
          <li>We tell you what we chose and why. Public mistakes go below.</li>
        </ol>
      </section>

      <section
        className="page-section form-section"
        aria-labelledby="appeal-form-title"
      >
        <div className="section-heading">
          <p className="eyebrow">Private form</p>
          <h2 id="appeal-form-title">What do we need to look at?</h2>
        </div>
        <AppealForm />
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
