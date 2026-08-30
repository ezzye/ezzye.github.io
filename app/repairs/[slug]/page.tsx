import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarClock, ShieldCheck, UserRoundCheck } from 'lucide-react';

import { ActionCard } from '@/components/action-card';
import { OutcomeCard } from '@/components/outcome-card';
import { formatDate } from '@/components/repair-card';
import { SiteShell } from '@/components/site-shell';
import { RepairStageBadge } from '@/components/workshop-status';
import { getPublicRepairBundle } from '@/db/queries';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getPublicRepairBundle(slug);
  return bundle
    ? { title: bundle.repair.title, description: bundle.repair.summary }
    : { title: 'Repair not found' };
}

export default async function RepairPage({ params }: PageProps) {
  const { slug } = await params;
  const bundle = await getPublicRepairBundle(slug);
  if (!bundle) notFound();
  const { repair, actions, outcomes, updates } = bundle;

  return (
    <SiteShell>
      <header className="page-hero repair-page-hero">
        <div className="ledger-card-meta">
          <span>{repair.id}</span>
          {repair.isDemo && <span className="demo-label">Demonstration</span>}
          <RepairStageBadge stage={repair.stage} />
        </div>
        <h1>{repair.title}</h1>
        <p>{repair.summary}</p>
        <dl className="hero-ledger">
          <div>
            <dt>
              <UserRoundCheck aria-hidden="true" /> Owner
            </dt>
            <dd>{repair.ownerName}</dd>
          </div>
          <div>
            <dt>
              <CalendarClock aria-hidden="true" /> Review
            </dt>
            <dd>{formatDate(repair.reviewDate)}</dd>
          </div>
          <div>
            <dt>
              <ShieldCheck aria-hidden="true" /> Partner
            </dt>
            <dd>
              {repair.partnerName ?? 'Not yet secured — demonstration only'}
            </dd>
          </div>
        </dl>
      </header>

      <section
        className="page-section evidence-ledger"
        aria-labelledby="frame-title"
      >
        <div className="section-heading">
          <p className="eyebrow">Problem frame</p>
          <h2 id="frame-title">What we can responsibly say</h2>
        </div>
        <dl>
          <div>
            <dt>Scope</dt>
            <dd>{repair.scope}</dd>
          </div>
          <div>
            <dt>Who may carry the cost</dt>
            <dd>{repair.affectedGroups}</dd>
          </div>
          <div>
            <dt>Known</dt>
            <dd>{repair.knownFacts}</dd>
          </div>
          <div>
            <dt>Unknown</dt>
            <dd>{repair.unknowns}</dd>
          </div>
          <div>
            <dt>Disputed</dt>
            <dd>{repair.disputedClaims}</dd>
          </div>
          <div>
            <dt>Measurably fairer</dt>
            <dd>{repair.desiredChange}</dd>
          </div>
          <div>
            <dt>Smallest test</dt>
            <dd>{repair.smallestTest}</dd>
          </div>
          <div className="safeguard-row">
            <dt>Safeguards and stop rule</dt>
            <dd>{repair.safeguards}</dd>
          </div>
        </dl>
      </section>

      <section className="page-section" aria-labelledby="actions-title">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Action cards</p>
            <h2 id="actions-title">Small enough to own and check</h2>
          </div>
          <p>
            An offer does not assign a task. Every contribution is reviewed for
            fit, boundaries and capacity before contact.
          </p>
        </div>
        <div className="card-grid action-grid">
          {actions.map((action) => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
      </section>

      {updates.length > 0 && (
        <section
          className="page-section updates-section"
          aria-labelledby="updates-title"
        >
          <div className="section-heading">
            <p className="eyebrow">Workshop notes</p>
            <h2 id="updates-title">What changed since the last review</h2>
          </div>
          <div className="timeline-list">
            {updates.map((update) => (
              <article key={update.id}>
                <p className="mini-label">{formatDate(update.publishedAt)}</p>
                <h3>{update.title}</h3>
                <p>{update.body}</p>
                <dl>
                  <div>
                    <dt>Evidence changed</dt>
                    <dd>{update.evidenceChanged}</dd>
                  </div>
                  <div>
                    <dt>Still unfair</dt>
                    <dd>{update.remainsUnfair}</dd>
                  </div>
                  <div>
                    <dt>Next owner and review</dt>
                    <dd>
                      {update.nextOwner}, {formatDate(update.nextReviewDate)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="page-section" aria-labelledby="repair-outcomes-title">
        <div className="section-heading">
          <p className="eyebrow">Outcome ledger</p>
          <h2 id="repair-outcomes-title">What happened</h2>
        </div>
        {outcomes.length > 0 ? (
          <div className="card-grid">
            {outcomes.map((outcome) => (
              <OutcomeCard key={outcome.id} outcome={outcome} />
            ))}
          </div>
        ) : (
          <p className="empty-ledger">No outcome has passed review yet.</p>
        )}
      </section>
    </SiteShell>
  );
}
