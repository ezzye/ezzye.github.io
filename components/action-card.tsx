import {
  CalendarClock,
  CircleStop,
  MapPin,
  ShieldCheck,
  Timer,
  Users,
} from 'lucide-react';

import { OfferHelpForm } from '@/components/offer-help-form';
import { formatDate } from '@/components/repair-card';
import { ActionStatusBadge } from '@/components/workshop-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActionCard as ActionCardType } from '@/lib/types';

export function ActionCard({
  action,
  isDemo = false,
}: {
  action: ActionCardType;
  isDemo?: boolean;
}) {
  const acceptingOffers =
    action.status === 'ready' || action.status === 'offered';
  return (
    <Card className="action-card">
      <CardHeader>
        <div className="ledger-card-meta">
          {isDemo ? (
            <span className="demo-label">Made-up job — not open</span>
          ) : (
            <ActionStatusBadge status={action.status} />
          )}
        </div>
        <CardTitle className="ledger-card-title">{action.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="action-output">{action.intendedOutput}</p>
        <dl className="action-facts">
          <div>
            <dt>
              <Timer aria-hidden="true" /> Time
            </dt>
            <dd>{action.timeSize}</dd>
          </div>
          <div>
            <dt>
              <MapPin aria-hidden="true" /> Where
            </dt>
            <dd>{action.locationMode}</dd>
          </div>
          <div>
            <dt>
              <Users aria-hidden="true" /> People needed
            </dt>
            <dd>
              {action.capacity} contributor{action.capacity === 1 ? '' : 's'}
            </dd>
          </div>
          <div>
            <dt>
              <CalendarClock aria-hidden="true" /> Check by
            </dt>
            <dd>{formatDate(action.reviewDate)}</dd>
          </div>
        </dl>
        <p className="job-skill">
          <strong>Skills:</strong> {action.skillsNeeded}
        </p>
        {isDemo && (
          <p className="demo-job-stop">
            This job is made up. No work or pay is being offered.
          </p>
        )}
        <details className="job-more">
          <summary>More about this job</summary>
          <div className="action-detail-grid">
            <div>
              <p className="mini-label">Why it matters</p>
              <p>{action.whyItMatters}</p>
            </div>
            <div>
              <p className="mini-label">How we know it is done</p>
              <p>{action.evidenceRequired}</p>
            </div>
            <div>
              <p className="mini-label">
                <ShieldCheck aria-hidden="true" /> Who does it — who checks it
              </p>
              <p>
                {action.ownerName} → {action.reviewerName}
              </p>
            </div>
            <div>
              <p className="mini-label">
                <CircleStop aria-hidden="true" /> When to stop
              </p>
              <p>{action.stopCondition}</p>
            </div>
          </div>
        </details>
        {!isDemo && acceptingOffers && (
          <details className="offer-disclosure">
            <summary>I can help with this job</summary>
            <OfferHelpForm actionId={action.id} actionTitle={action.title} />
          </details>
        )}
      </CardContent>
    </Card>
  );
}
