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

export function ActionCard({ action }: { action: ActionCardType }) {
  const acceptingOffers =
    action.status === 'ready' || action.status === 'offered';
  return (
    <Card className="action-card">
      <CardHeader>
        <div className="ledger-card-meta">
          <span>{action.id}</span>
          <ActionStatusBadge status={action.status} />
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
              <Users aria-hidden="true" /> Capacity
            </dt>
            <dd>
              {action.capacity} contributor{action.capacity === 1 ? '' : 's'}
            </dd>
          </div>
          <div>
            <dt>
              <CalendarClock aria-hidden="true" /> Review
            </dt>
            <dd>{formatDate(action.reviewDate)}</dd>
          </div>
        </dl>
        <div className="action-detail-grid">
          <div>
            <p className="mini-label">Why it matters</p>
            <p>{action.whyItMatters}</p>
          </div>
          <div>
            <p className="mini-label">Completion evidence</p>
            <p>{action.evidenceRequired}</p>
          </div>
          <div>
            <p className="mini-label">
              <ShieldCheck aria-hidden="true" /> Review pair
            </p>
            <p>
              {action.ownerName} → {action.reviewerName}
            </p>
          </div>
          <div>
            <p className="mini-label">
              <CircleStop aria-hidden="true" /> Stop condition
            </p>
            <p>{action.stopCondition}</p>
          </div>
        </div>
        {acceptingOffers && (
          <details className="offer-disclosure">
            <summary>Offer help with this bounded task</summary>
            <OfferHelpForm actionId={action.id} actionTitle={action.title} />
          </details>
        )}
      </CardContent>
    </Card>
  );
}
