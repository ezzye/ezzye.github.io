import type { Metadata } from 'next';

import { AppealForm } from '@/components/appeal-form';
import { formatDate } from '@/components/repair-card';
import { SiteShell } from '@/components/site-shell';
import { getPublishedCorrections } from '@/db/queries';

export const metadata: Metadata = {
  title: 'Corrections and appeals',
  description:
    'Ask for a factual correction, privacy removal, accessibility fix or moderation review.',
};
export const dynamic = 'force-dynamic';

export default async function AppealPage() {
  const corrections = await getPublishedCorrections();
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">Accountability runs both ways</p>
        <h1>Corrections and appeals</h1>
        <p>
          Point to the exact claim or decision. A reviewer who did not make the
          original decision should examine the evidence, privacy and covenant
          rule.
        </p>
      </header>

      <section
        className="page-section review-standard"
        aria-labelledby="standard-title"
      >
        <div className="section-heading">
          <p className="eyebrow">Review standard</p>
          <h2 id="standard-title">Specific, private and reasoned.</h2>
        </div>
        <ol>
          <li>Immediate privacy or safety risks are triaged first.</li>
          <li>
            The original editor records the source and rule behind the decision.
          </li>
          <li>
            A different reviewer considers the request and any public evidence.
          </li>
          <li>
            The requester receives a reasoned decision; public errors enter the
            correction log.
          </li>
        </ol>
      </section>

      <section
        className="page-section form-section"
        aria-labelledby="appeal-form-title"
      >
        <div className="section-heading">
          <p className="eyebrow">Private review request</p>
          <h2 id="appeal-form-title">
            Tell us exactly what needs another look.
          </h2>
        </div>
        <AppealForm />
      </section>

      <section
        className="page-section corrections-section"
        aria-labelledby="corrections-title"
      >
        <div className="section-heading">
          <p className="eyebrow">Public record</p>
          <h2 id="corrections-title">Correction log</h2>
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
