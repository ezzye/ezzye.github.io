import Link from 'next/link';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { OutcomeCard } from '@/components/outcome-card';
import { formatDate } from '@/components/repair-card';
import { SiteShell } from '@/components/site-shell';
import { RepairStageBadge } from '@/components/workshop-status';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getCurrentRepairBundle, getLatestOutcomes } from '@/db/queries';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const process = [
  [
    'Listen',
    'A private account arrives. We remove identifying detail and check immediate safety.',
  ],
  [
    'Frame',
    'Known facts, unknowns, affected groups, desired change and safeguards become visible.',
  ],
  [
    'Act',
    'A bounded task gets an owner, reviewer, time-box, output and stop condition.',
  ],
  [
    'Check',
    'We distinguish completed activity from an observed or independently verified effect.',
  ],
  [
    'Publish',
    'The outcome ledger records who benefited, what did not change and what we learned.',
  ],
];

export default async function Home() {
  const [bundle, outcomes] = await Promise.all([
    getCurrentRepairBundle(),
    getLatestOutcomes(1),
  ]);
  const nextAction = bundle.actions.find(
    (action) => action.status === 'ready' || action.status === 'offered',
  );

  return (
    <SiteShell>
      <section className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">A fairness repair workshop</p>
          <h1>Turn concern into repair.</h1>
          <p className="hero-intro">
            Bring one repeatable unfair process. We will frame a small test,
            find the right people to help, and publish what actually happened.
          </p>
          <p className="hero-belief">
            Built for dignity, equity and evidence — without outrage ranking,
            pile-ons or automatic publication.
          </p>
          <div className="hero-actions">
            <Link
              className={cn(buttonVariants({ size: 'lg' }), 'primary-cta')}
              href="/start"
            >
              Bring a barrier <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'secondary-cta',
              )}
              href={`/repairs/${bundle.repair.slug}`}
            >
              See the work
            </Link>
          </div>
          <p className="trust-line">
            <span>Private intake</span> · <span>human review</span> ·{' '}
            <span>public evidence</span> · <span>right of appeal</span>
          </p>
        </div>

        <Card className="current-repair">
          <CardHeader>
            <div className="repair-kicker">
              <CircleDot aria-hidden="true" /> Current repair
              {bundle.repair.isDemo && (
                <span className="demo-label">Demonstration</span>
              )}
            </div>
            <h2 className="repair-title">{bundle.repair.title}</h2>
            <RepairStageBadge stage={bundle.repair.stage} />
          </CardHeader>
          <CardContent>
            <p className="repair-description">{bundle.repair.summary}</p>
            <dl className="repair-facts">
              <div>
                <dt>
                  <CheckCircle2 aria-hidden="true" /> Smallest test
                </dt>
                <dd>{bundle.repair.smallestTest}</dd>
              </div>
              <div>
                <dt>
                  <Users aria-hidden="true" /> Useful contribution
                </dt>
                <dd>
                  {nextAction?.title ?? 'No open task at this review point'}
                </dd>
              </div>
              <div>
                <dt>
                  <CalendarClock aria-hidden="true" /> Next review
                </dt>
                <dd>{formatDate(bundle.repair.reviewDate)}</dd>
              </div>
            </dl>
            <Link
              className="repair-link"
              href={`/repairs/${bundle.repair.slug}`}
            >
              See evidence, safeguards and actions{' '}
              <ArrowRight aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section
        className="page-section process-section"
        aria-labelledby="process-title"
      >
        <div className="section-heading">
          <p className="eyebrow">The operating system</p>
          <h2 id="process-title">Hope is a process you can inspect.</h2>
          <p>
            We do not promise to fix the world. We make the next fair action
            small, owned and checkable.
          </p>
        </div>
        <ol className="process-grid">
          {process.map(([title, body], index) => (
            <li key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="page-section principle-panel"
        aria-labelledby="principle-title"
      >
        <div>
          <p className="eyebrow">A protected working culture</p>
          <h2 id="principle-title">Warmth is part of the infrastructure.</h2>
        </div>
        <div className="principle-copy">
          <p>
            Attention is not a prize here. It is a responsibility: greet the
            person, understand the barrier, make room for difference, and
            challenge a claim without humiliating its author.
          </p>
          <p>
            Our founding affirmation is that Jason Arday was unable to speak as
            a child, defied the odds and became a Black Cambridge professor —
            deservedly so. It declares the direction of travel; the covenant
            turns that belief into observable conduct.
          </p>
          <Link className="repair-link" href="/covenant">
            Read the covenant and evidence rule{' '}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      {outcomes[0] && (
        <section
          className="page-section latest-outcome"
          aria-labelledby="outcome-title"
        >
          <div className="section-heading">
            <p className="eyebrow">Outcome, not applause</p>
            <h2 id="outcome-title">What changed — and what did not.</h2>
            <p>
              Every public claim carries an evidence level and an explicit
              limit.
            </p>
          </div>
          <OutcomeCard outcome={outcomes[0]} />
        </section>
      )}

      <section
        className="page-section closing-callout"
        aria-labelledby="closing-title"
      >
        <ShieldCheck aria-hidden="true" />
        <div>
          <h2 id="closing-title">Start with one repairable barrier.</h2>
          <p>
            No public accusation is required. You can send private background,
            request a redacted draft, or simply inspect the demonstration first.
          </p>
        </div>
        <Link className={buttonVariants({ size: 'lg' })} href="/start">
          Start privately
        </Link>
      </section>
    </SiteShell>
  );
}
