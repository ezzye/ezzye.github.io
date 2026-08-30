import Link from 'next/link';
import { ArrowRight, CalendarClock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RepairStageBadge } from '@/components/workshop-status';
import type { Repair } from '@/lib/types';

export function RepairCard({ repair }: { repair: Repair }) {
  return (
    <Card className="ledger-card">
      <CardHeader>
        <div className="ledger-card-meta">
          {repair.isDemo && <span className="demo-label">Made-up example</span>}
          <RepairStageBadge stage={repair.stage} />
        </div>
        <CardTitle className="ledger-card-title">{repair.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="ledger-card-summary">{repair.summary}</p>
        <p className="review-date">
          <CalendarClock aria-hidden="true" /> Check again{' '}
          {formatDate(repair.reviewDate)}
        </p>
        <Link className="repair-link" href={`/repairs/${repair.slug}`}>
          See this work <ArrowRight aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function formatDate(value: string) {
  const date = new Date(
    `${value.length === 10 ? `${value}T12:00:00Z` : value}`,
  );
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/London',
  }).format(date);
}
