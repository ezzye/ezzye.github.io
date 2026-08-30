import type { Metadata } from 'next';

import { RepairCard } from '@/components/repair-card';
import { SiteShell } from '@/components/site-shell';
import { getPublicRepairs } from '@/db/queries';

export const metadata: Metadata = {
  title: 'Repairs',
  description:
    'Active and completed fairness repairs with scope, safeguards and review dates.',
};
export const dynamic = 'force-dynamic';

export default async function RepairsPage() {
  const repairs = await getPublicRepairs();
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">Public work ledger</p>
        <h1>Repairs</h1>
        <p>
          Each repair has a bounded problem, named owners, a smallest useful
          test, safeguards and a date when the work must be reconsidered.
        </p>
      </header>
      <section
        className="page-section card-grid"
        aria-label="Published repairs"
      >
        {repairs.map((repair) => (
          <RepairCard key={repair.id} repair={repair} />
        ))}
      </section>
    </SiteShell>
  );
}
