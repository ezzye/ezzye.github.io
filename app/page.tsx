import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { SiteShell } from '@/components/site-shell';
import { buttonVariants } from '@/components/ui/button';
import {
  getActionResponseRetentionSweep,
  getHomeRepairBundle,
} from '@/db/queries';
import { pilotRuntimeIsReady, publicIntakeIsOpen } from '@/lib/public-intake';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [bundle, retentionSweep] = await Promise.all([
    getHomeRepairBundle(),
    getActionResponseRetentionSweep(),
  ]);
  const publicIntakeOpen = publicIntakeIsOpen();
  const nextAction = bundle.actions.find(
    (action) =>
      (action.status === 'ready' || action.status === 'offered') &&
      action.compensation !== 'Pay not set — job cannot open' &&
      (action.participationMode === 'offer' ||
        (action.responseQuestions.length > 0 && action.responsePath)),
  );
  const hasRealJob = !bundle.repair.isDemo && Boolean(nextAction);
  const pilotIsOpen = Boolean(
    hasRealJob &&
    nextAction &&
    !nextAction.isPreview &&
    pilotRuntimeIsReady(nextAction, retentionSweep),
  );
  const jobLink =
    nextAction?.responsePath ?? `/repairs/${bundle.repair.slug}#open-jobs`;
  const choices = [
    {
      number: '1',
      title: pilotIsOpen
        ? 'I want to help'
        : hasRealJob
          ? 'Preview the first job'
          : 'See a sample job',
      body: hasRealJob
        ? pilotIsOpen
          ? `A real job is open. ${nextAction?.timeSize}. ${nextAction?.compensation}`
          : 'Answers are off. Check the wording and flow.'
        : 'See the kind of small job we will post. No real job is open yet.',
      link: hasRealJob ? jobLink : '/repairs/public-consultation#open-jobs',
      action: hasRealJob ? 'Check the first job' : 'See an example job',
    },
    {
      number: '2',
      title: publicIntakeOpen ? 'I need help' : 'How to ask for help',
      body: publicIntakeOpen
        ? 'Tell us about a bad rule, form or service. What you send stays private.'
        : 'The private form is not open yet. See what it will ask.',
      link: '/start',
      action: publicIntakeOpen
        ? 'Tell us what is wrong'
        : 'See how it will work',
    },
    {
      number: '3',
      title: 'I want to look',
      body: 'See what people tried, what worked and what did not.',
      link: '/outcomes',
      action: 'See what changed',
    },
  ];

  return (
    <SiteShell>
      <section className="plain-home" aria-labelledby="home-title">
        <div className="plain-opening">
          <div className="plain-intro">
            <p className="plain-kicker">Start here</p>
            <h1 id="home-title">
              Pick a small job. Help fix something unfair.
            </h1>
            <div className="plain-answers">
              <p>
                <strong>What is this?</strong> A to-do list for fixing bad
                forms, rules and services.
              </p>
              <p>
                <strong>Why should I care?</strong> Bad forms and rules can shut
                people out. You may know the problem or have a skill that helps.
              </p>
              <p>
                <strong>What do I do?</strong> Pick one of the three boxes
                below.
              </p>
            </div>
          </div>

          <figure className="warm-photo">
            <Image
              src="/people-working-together.jpg"
              width="1400"
              height="933"
              alt="Four people sitting round a table and working on a paper form together."
              priority
              unoptimized
            />
            <figcaption>
              <strong>People, not clicks.</strong> This is an AI-made scene, not
              a real Coding for Justice group.
            </figcaption>
          </figure>
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
          <p className="plain-kicker">
            {hasRealJob
              ? pilotIsOpen
                ? 'First five-person test'
                : 'Read-only rehearsal'
              : 'Made-up example'}
          </p>
          <h2 id="one-job-title">
            {hasRealJob ? nextAction?.title : 'Read one short guide'}
          </h2>
          <p className="one-job-lede">
            {hasRealJob
              ? nextAction?.intendedOutput
              : 'Read one page. Tell us what is hard to follow.'}
          </p>
          <ul className="job-facts" aria-label="Job facts">
            <li>
              <Check aria-hidden="true" />{' '}
              {hasRealJob ? nextAction?.timeSize : '20 mins'}
            </li>
            <li>
              <Check aria-hidden="true" />{' '}
              {hasRealJob ? nextAction?.locationMode : 'At home'}
            </li>
            <li>
              <Check aria-hidden="true" />{' '}
              {hasRealJob ? nextAction?.compensation : 'No expert skill needed'}
            </li>
          </ul>
          <Link
            className={cn(buttonVariants({ size: 'lg' }), 'plain-button')}
            href={jobLink}
          >
            {hasRealJob
              ? 'Check the 10-minute test'
              : 'See how this job would work'}{' '}
            <ArrowRight aria-hidden="true" />
          </Link>
          <p className="click-note">
            {hasRealJob
              ? pilotIsOpen
                ? 'Invitation only. Each person gets a one-use private link.'
                : 'Read-only rehearsal. Answers are off.'
              : 'This is not a real job. You cannot sign up for it.'}
          </p>
        </div>
        <aside className="demo-note">
          <strong>
            {hasRealJob
              ? `${nextAction?.capacity} replies, then we check them.`
              : 'No real job is open yet.'}
          </strong>
          <p>
            {hasRealJob
              ? 'Before we ask people to fix other bad pages, we need to know this site makes sense.'
              : 'It uses a made-up council letter. No real person or town is named.'}
          </p>
          <p>
            {hasRealJob
              ? 'Please do not read the plan first. We need fresh eyes.'
              : `A real job page would show its ${nextAction?.capacity ?? 2} open places here.`}
          </p>
        </aside>
      </section>

      <section className="plain-steps" aria-labelledby="steps-title">
        <div>
          <p className="plain-kicker">How it works</p>
          <h2 id="steps-title">Yes. It is a task list.</h2>
          <p>
            Pick a job. The page tells you whether to do it now or offer help.
            We check the result. Then we say what changed.
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
            <strong>Do it or offer help</strong>
            <p>Each job says which one.</p>
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
