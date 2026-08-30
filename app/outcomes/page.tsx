import type { Metadata } from 'next';

import { OutcomeCard } from '@/components/outcome-card';
import { SiteShell } from '@/components/site-shell';
import { getLatestOutcomes } from '@/db/queries';

export const metadata: Metadata = {
  title: 'Outcome ledger',
  description:
    'Publicly reviewed repair outcomes, their evidence level and their limits.',
};
export const dynamic = 'force-dynamic';

export default async function OutcomesPage() {
  const outcomes = await getLatestOutcomes();
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">Evidence before applause</p>
        <h1>Outcome ledger</h1>
        <p>
          Activity is not impact. Each entry says what was done, what was
          observed, how confident we are and what stubbornly did not change.
        </p>
      </header>
      <section
        className="page-section card-grid"
        aria-label="Published outcomes"
      >
        {outcomes.map((outcome) => (
          <OutcomeCard key={outcome.id} outcome={outcome} />
        ))}
      </section>
    </SiteShell>
  );
}
