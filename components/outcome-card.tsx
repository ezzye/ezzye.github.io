import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfidenceBadge } from '@/components/workshop-status';
import { formatDate } from '@/components/repair-card';
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
        <CardTitle className="ledger-card-title">{outcome.title}</CardTitle>
      </CardHeader>
      <CardContent className="outcome-content">
        <div>
          <p className="mini-label">What we did</p>
          <p>{outcome.activity}</p>
        </div>
        <div>
          <p className="mini-label">What changed</p>
          <p>{outcome.observedEffect}</p>
        </div>
        <div className="outcome-limit">
          <p className="mini-label">What did not change</p>
          <p>{outcome.whatDidNotChange}</p>
        </div>
        {outcome.repairSlug && (
          <Link className="repair-link" href={`/repairs/${outcome.repairSlug}`}>
            See all the work behind this
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
