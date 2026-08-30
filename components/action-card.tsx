import Link from 'next/link';
import {
  ArrowRight,
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
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActionCard as ActionCardType } from '@/lib/types';
import { publicIntakeIsOpen } from '@/lib/public-intake';
import { cn } from '@/lib/utils';

export function ActionCard({
  action,
  isDemo = false,
  pilotRuntimeReady = false,
}: {
  action: ActionCardType;
  isDemo?: boolean;
  pilotRuntimeReady?: boolean;
}) {
  const intakeOpen = publicIntakeIsOpen();
  const acceptingOffers =
    (action.status === 'ready' || action.status === 'offered') &&
    action.compensation !== 'Pay not set — job cannot open' &&
    !action.isPreview &&
    (action.participationMode !== 'direct_response' || pilotRuntimeReady) &&
    (action.participationMode !== 'offer' || intakeOpen);
  const hasDirectResponsePage =
    action.participationMode === 'direct_response' &&
    action.responseQuestions.length > 0 &&
    Boolean(action.responsePath);
  return (
    <Card className="action-card">
      <CardHeader>
        <div className="ledger-card-meta">
          {isDemo ? (
            <span className="demo-label">Made-up job — not open</span>
          ) : action.isPreview ? (
            <span className="demo-label">Read-only preview — not open</span>
          ) : action.participationMode === 'direct_response' &&
            !pilotRuntimeReady ? (
            <span className="demo-label">Replies are off</span>
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
          {!isDemo && (
            <div>
              <dt>Pay</dt>
              <dd>{action.compensation}</dd>
            </div>
          )}
          <div>
            <dt>
              <Users aria-hidden="true" />{' '}
              {action.participationMode === 'direct_response'
                ? 'Replies needed'
                : 'People needed'}
            </dt>
            <dd>
              {action.capacity}
              {action.participationMode === 'direct_response'
                ? ''
                : ` contributor${action.capacity === 1 ? '' : 's'}`}
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
        {!isDemo &&
          action.participationMode === 'direct_response' &&
          !hasDirectResponsePage && (
            <p className="demo-job-stop">
              This job is not ready to take replies.
            </p>
          )}
        {!isDemo &&
          action.participationMode === 'direct_response' &&
          !action.isPreview &&
          hasDirectResponsePage &&
          !acceptingOffers && (
            <p className="demo-job-stop">
              {pilotRuntimeReady
                ? 'This job is closed. We are checking the replies now.'
                : 'Replies are off while the privacy, permission and exact wording checks are finished.'}
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
        {!isDemo && hasDirectResponsePage && (
          <div className="offer-disclosure direct-response-link">
            {!acceptingOffers && (
              <p>
                Answers are off. You can check the form, but nothing can be
                sent.
              </p>
            )}
            {acceptingOffers && (
              <p>
                This test uses one-use links. Only the full link sent to a
                tester can take a reply.
              </p>
            )}
            <Link
              className={cn(buttonVariants({ size: 'lg' }), 'plain-button')}
              href={action.responsePath!}
            >
              {action.isPreview ? 'Preview the form' : 'See how the test works'}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        )}
        {!isDemo && acceptingOffers && action.participationMode === 'offer' && (
          <details className="offer-disclosure">
            <summary>I can help with this job</summary>
            <OfferHelpForm actionId={action.id} actionTitle={action.title} />
          </details>
        )}
        {!isDemo &&
          action.participationMode === 'offer' &&
          !action.isPreview &&
          !intakeOpen && (
            <p className="demo-job-stop">
              Offers are not open yet. We are checking the privacy and reply
              process first.
            </p>
          )}
      </CardContent>
    </Card>
  );
}
