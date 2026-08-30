import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarClock, ShieldCheck, UserRoundCheck } from 'lucide-react';

import { ActionCard } from '@/components/action-card';
import { OutcomeCard } from '@/components/outcome-card';
import { formatDate } from '@/components/repair-card';
import { SiteShell } from '@/components/site-shell';
import { RepairStageBadge } from '@/components/workshop-status';
import {
  getActionResponseRetentionSweep,
  getPublicRepairBundle,
} from '@/db/queries';
import { pilotRuntimeIsReady } from '@/lib/public-intake';

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
  const [bundle, retentionSweep] = await Promise.all([
    getPublicRepairBundle(slug),
    getActionResponseRetentionSweep(),
  ]);
  if (!bundle) notFound();
  const { repair, actions, outcomes, updates } = bundle;
  const directResponseActions = actions.filter(
    (action) => action.participationMode === 'direct_response',
  );
  const directResponseReadiness = new Map(
    directResponseActions.map((action) => [
      action.id,
      pilotRuntimeIsReady(action, retentionSweep),
    ]),
  );
  const hasDirectResponse = directResponseActions.length > 0;
  const hasPreviewResponse = directResponseActions.some(
    (action) => action.isPreview,
  );
  const hasOpenDirectResponse = directResponseActions.some(
    (action) =>
      !action.isPreview &&
      directResponseReadiness.get(action.id) &&
      (action.status === 'ready' || action.status === 'offered'),
  );

  return (
    <SiteShell>
      <header className="page-hero repair-page-hero">
        <div className="ledger-card-meta">
          {repair.isDemo ? (
            <span className="demo-page-banner">
              Made-up example — no real job is open
            </span>
          ) : (
            <span>{repair.id}</span>
          )}
          <RepairStageBadge stage={repair.stage} />
        </div>
        <h1>{repair.title}</h1>
        <p>{repair.summary}</p>
        <p className="page-help">
          {hasPreviewResponse
            ? 'This is a read-only preview. The form is below, but answers are off.'
            : hasOpenDirectResponse
              ? 'The job is below. Answer five short questions. No name or email.'
              : hasDirectResponse
                ? 'The test is below, but replies are off while its safety checks are finished.'
                : 'Read this page to see what is wrong. Jump to the small jobs to see how helping would work.'}
        </p>
        <dl className="hero-ledger">
          <div>
            <dt>
              <UserRoundCheck aria-hidden="true" /> Lead
            </dt>
            <dd>{repair.ownerName}</dd>
          </div>
          <div>
            <dt>
              <CalendarClock aria-hidden="true" /> Check again
            </dt>
            <dd>{formatDate(repair.reviewDate)}</dd>
          </div>
          <div>
            <dt>
              <ShieldCheck aria-hidden="true" /> Group we work with
            </dt>
            <dd>
              {repair.partnerName ??
                (repair.isDemo
                  ? 'None — this page is made up'
                  : 'No outside group yet')}
            </dd>
          </div>
        </dl>
      </header>

      <section
        className="page-section evidence-ledger"
        aria-labelledby="frame-title"
      >
        <div className="section-heading">
          <p className="eyebrow">The problem</p>
          <h2 id="frame-title">What we know</h2>
        </div>
        <dl>
          <div>
            <dt>Where this happens</dt>
            <dd>{repair.scope}</dd>
          </div>
          <div>
            <dt>Who gets hurt or shut out</dt>
            <dd>{repair.affectedGroups}</dd>
          </div>
          <div>
            <dt>What we know</dt>
            <dd>{repair.knownFacts}</dd>
          </div>
          <div>
            <dt>What we do not know</dt>
            <dd>{repair.unknowns}</dd>
          </div>
          <div>
            <dt>What people do not agree on</dt>
            <dd>{repair.disputedClaims}</dd>
          </div>
          <div>
            <dt>What better would look like</dt>
            <dd>{repair.desiredChange}</dd>
          </div>
          <div>
            <dt>What we will try first</dt>
            <dd>{repair.smallestTest}</dd>
          </div>
          <div className="safeguard-row">
            <dt>How we keep people safe — and when we stop</dt>
            <dd>{repair.safeguards}</dd>
          </div>
        </dl>
      </section>

      <section
        className="page-section"
        id="open-jobs"
        aria-labelledby="actions-title"
      >
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">
              {repair.isDemo ? 'Example jobs' : 'Small jobs'}
            </p>
            <h2 id="actions-title">
              {repair.isDemo
                ? 'See how helping would work'
                : hasPreviewResponse
                  ? 'Preview the 10-minute form'
                  : hasOpenDirectResponse
                    ? 'Do this 10-minute job'
                    : hasDirectResponse
                      ? 'Read the 10-minute test'
                      : 'Pick one small job'}
            </h2>
          </div>
          <p>
            {repair.isDemo
              ? 'These jobs are made up. You cannot sign up. A real job will say if it is paid or unpaid.'
              : hasPreviewResponse
                ? 'Answers are not being accepted. Check the wording and safeguards. Do not invite testers yet.'
                : hasOpenDirectResponse
                  ? 'Do this job on this page. We ask for no name or email. Full answers stay private and cannot be the source of a public result.'
                  : hasDirectResponse
                    ? 'Replies are off while the privacy, permission and exact wording checks are finished.'
                    : 'Saying “I can help” does not give you the job. We first check it is safe, clear and a good fit.'}
          </p>
        </div>
        <div className="card-grid action-grid">
          {actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              isDemo={repair.isDemo}
              pilotRuntimeReady={
                action.participationMode === 'direct_response'
                  ? directResponseReadiness.get(action.id)
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      {updates.length > 0 && (
        <section
          className="page-section updates-section"
          aria-labelledby="updates-title"
        >
          <div className="section-heading">
            <p className="eyebrow">News</p>
            <h2 id="updates-title">What changed since the last check</h2>
          </div>
          <div className="timeline-list">
            {updates.map((update) => (
              <article key={update.id}>
                <p className="mini-label">{formatDate(update.publishedAt)}</p>
                <h3>{update.title}</h3>
                <p>{update.body}</p>
                <dl>
                  <div>
                    <dt>New facts</dt>
                    <dd>{update.evidenceChanged}</dd>
                  </div>
                  <div>
                    <dt>What is still wrong</dt>
                    <dd>{update.remainsUnfair}</dd>
                  </div>
                  <div>
                    <dt>Who goes next — and when we check</dt>
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
          <p className="eyebrow">Result</p>
          <h2 id="repair-outcomes-title">What changed</h2>
        </div>
        {outcomes.length > 0 ? (
          <div className="card-grid">
            {outcomes.map((outcome) => (
              <OutcomeCard
                key={outcome.id}
                outcome={{ ...outcome, repairIsDemo: repair.isDemo }}
              />
            ))}
          </div>
        ) : (
          <p className="empty-ledger">
            Nothing has been checked and shown yet.
          </p>
        )}
      </section>
    </SiteShell>
  );
}
