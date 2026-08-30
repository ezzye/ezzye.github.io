import type { Metadata } from 'next';

import { OutcomeCard } from '@/components/outcome-card';
import { SiteShell } from '@/components/site-shell';
import { getLatestOutcomes } from '@/db/queries';

export const metadata: Metadata = {
  title: 'What changed',
  description: 'What people tried, what changed and what is still wrong.',
};
export const dynamic = 'force-dynamic';

export default async function OutcomesPage() {
  const outcomes = await getLatestOutcomes();
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">Results</p>
        <h1>What changed?</h1>
        <p>
          Here is what people did, what changed and what did not. Clicks, likes
          and noise do not count as change.
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
