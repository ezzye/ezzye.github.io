import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { SiteShell } from '@/components/site-shell';
import { buttonVariants } from '@/components/ui/button';
import { getCurrentRepairBundle } from '@/db/queries';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const choices = [
  {
    number: '1',
    title: 'I want to help',
    body: 'See the kind of small job we will post. No real job is open yet.',
    link: '/repairs/public-consultation#open-jobs',
    action: 'See an example job',
  },
  {
    number: '2',
    title: 'I need help',
    body: 'Tell us about a bad rule, form or service. What you send stays private.',
    link: '/start',
    action: 'Tell us what is wrong',
  },
  {
    number: '3',
    title: 'I want to look',
    body: 'See what people tried, what worked and what did not.',
    link: '/outcomes',
    action: 'See what changed',
  },
];

export default async function Home() {
  const bundle = await getCurrentRepairBundle();
  const nextAction = bundle.actions.find(
    (action) => action.status === 'ready' || action.status === 'offered',
  );

  return (
    <SiteShell>
      <section className="plain-home" aria-labelledby="home-title">
        <div className="plain-intro">
          <p className="plain-kicker">Start here</p>
          <h1 id="home-title">Pick a small job. Help fix something unfair.</h1>
          <div className="plain-answers">
            <p>
              <strong>What is this?</strong> A to-do list for fixing bad forms,
              rules and services.
            </p>
            <p>
              <strong>Why should I care?</strong> Bad forms and rules can shut
              people out. You may know the problem or have a skill that helps.
            </p>
            <p>
              <strong>What do I do?</strong> Pick one of the three boxes below.
            </p>
          </div>
        </div>

        <section className="choice-block" aria-labelledby="choice-title">
          <h2 id="choice-title">What do you want to do?</h2>
          <div className="choice-cards">
            {choices.map((choice) => (
              <Link
                className="choice-card"
                href={choice.link}
                key={choice.title}
              >
                <span className="choice-number" aria-hidden="true">
                  {choice.number}
                </span>
                <span>
                  <strong>{choice.title}</strong>
                  <span>{choice.body}</span>
                  <b>
                    {choice.action} <ArrowRight aria-hidden="true" />
                  </b>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <section className="one-job" aria-labelledby="one-job-title">
        <div>
          <p className="plain-kicker">Made-up example</p>
          <h2 id="one-job-title">Read one short guide</h2>
          <p className="one-job-lede">
            Read one page. Tell us what is hard to follow.
          </p>
          <ul className="job-facts" aria-label="Job facts">
            <li>
              <Check aria-hidden="true" /> 20 mins
            </li>
            <li>
              <Check aria-hidden="true" /> At home
            </li>
            <li>
              <Check aria-hidden="true" /> No expert skill needed
            </li>
          </ul>
          <Link
            className={cn(buttonVariants({ size: 'lg' }), 'plain-button')}
            href={`/repairs/${bundle.repair.slug}#open-jobs`}
          >
            See how this job would work <ArrowRight aria-hidden="true" />
          </Link>
          <p className="click-note">
            This is not a real job. You cannot sign up for it.
          </p>
        </div>
        <aside className="demo-note">
          <strong>No real job is open yet.</strong>
          <p>
            It uses a made-up council letter. No real person or town is named.
          </p>
          {nextAction && (
            <p>
              A real job page would show its {nextAction.capacity} open places
              here.
            </p>
          )}
        </aside>
      </section>

      <section className="plain-steps" aria-labelledby="steps-title">
        <div>
          <p className="plain-kicker">How it works</p>
          <h2 id="steps-title">Yes. It is a task list.</h2>
          <p>
            You offer to help with one job. We check it is safe and a good fit.
            You do the job. We show what changed.
          </p>
        </div>
        <ol>
          <li>
            <span>1</span>
            <strong>Pick a job</strong>
            <p>Know the time and the goal.</p>
          </li>
          <li>
            <span>2</span>
            <strong>Do the job</strong>
            <p>Work alone or with one other person.</p>
          </li>
          <li>
            <span>3</span>
            <strong>We check it</strong>
            <p>Then we say what changed.</p>
          </li>
        </ol>
      </section>

      <section className="plain-rule" aria-labelledby="rule-title">
        <div>
          <p className="plain-kicker">Our ground rule</p>
          <h2 id="rule-title">
            No bullies. No pile-ons. No one gets talked down to.
          </h2>
        </div>
        <Link href="/covenant">
          Read our rules <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </SiteShell>
  );
}
