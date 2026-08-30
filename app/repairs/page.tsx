import type { Metadata } from 'next';

import { RepairCard } from '@/components/repair-card';
import { SiteShell } from '@/components/site-shell';
import { getPublicRepairs } from '@/db/queries';

export const metadata: Metadata = {
  title: "What we're fixing",
  description:
    'The unfair forms, rules and services people are trying to put right.',
};
export const dynamic = 'force-dynamic';

export default async function RepairsPage() {
  const repairs = await getPublicRepairs();
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">The work</p>
        <h1>What we&apos;re fixing</h1>
        <p>
          Open one to see what is wrong, what people will try and who will check
          the work. Made-up pages are marked in plain sight.
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
