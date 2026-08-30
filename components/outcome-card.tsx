import Link from 'next/link';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ConfidenceBadge } from '@/components/workshop-status';
import { formatDate } from '@/components/repair-card';
import { OutcomePublicBody } from '@/components/outcome-public-body';
import type { Outcome } from '@/lib/types';

export function OutcomeCard({ outcome }: { outcome: Outcome }) {
  return (
    <Card className="outcome-card">
      <CardHeader>
        <div className="ledger-card-meta">
          {outcome.repairIsDemo ? (
            <span className="demo-page-banner">Made-up result</span>
          ) : (
            <ConfidenceBadge confidence={outcome.confidence} />
          )}
          <span>{formatDate(outcome.publishedAt)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <OutcomePublicBody outcome={outcome} />
        {outcome.repairSlug && (
          <Link className="repair-link" href={`/repairs/${outcome.repairSlug}`}>
            See all the work behind this
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
