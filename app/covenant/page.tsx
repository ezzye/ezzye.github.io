import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Scale, Shield, X } from 'lucide-react';

import { SiteShell } from '@/components/site-shell';

export const metadata: Metadata = {
  title: 'Our rules',
  description: 'Be kind, stand for DEI, check facts and say no to pile-ons.',
};

export default function CovenantPage() {
  return (
    <SiteShell>
      <header className="page-hero covenant-hero">
        <p className="eyebrow">Our rules</p>
        <h1>Kind to people. Hard on unfair rules.</h1>
        <p>
          You do not have to agree with every claim. You do have to stand for
          DEI, treat people with care, check facts and say no to pile-ons.
        </p>
      </header>

      <section
        className="page-section founding-affirmation"
        aria-labelledby="affirmation-title"
      >
        <p className="eyebrow">Why Jason Arday matters here</p>
        <h2 id="affirmation-title">
          Jason Arday was unable to speak as a child, defied the odds and became
          a Black Cambridge professor — deservedly so.
        </h2>
        <p>
          This tells you which way we face. A person&apos;s start in life must
          not set their worth. Race, class or disability must not shut the door.
        </p>
        <p>
          We still check facts. We do not use Jason Arday as a mascot or ask him
          to speak for us.
        </p>
        <p className="source-note">
          Cambridge backs the main facts in its{' '}
          <a href="https://news.educ.cam.ac.uk/230223-jason-arday">
            news story
          </a>{' '}
          and{' '}
          <a href="https://faculty.educ.cam.ac.uk/people/staff/arday/">
            staff page
          </a>
          . “Deservedly so” is what we believe.
        </p>
      </section>

      <section className="page-section covenant-columns" aria-label="Our rules">
        <article className="covenant-positive">
          <Check aria-hidden="true" />
          <h2>You must</h2>
          <ul>
            <li>Stand for DEI and each person&apos;s worth.</li>
            <li>Listen. Do not make people show their pain.</li>
            <li>Say what you know and what you do not know.</li>
            <li>Test a claim without shaming the person.</li>
            <li>Fix the record when new facts come in.</li>
            <li>Share praise and make room for quiet ways to help.</li>
          </ul>
        </article>
        <article className="covenant-negative">
          <X aria-hidden="true" />
          <h2>You must not</h2>
          <ul>
            <li>Bring hate based on who someone is.</li>
            <li>Bully, gang up on, expose or set a crowd on someone.</li>
            <li>Treat likes, fame, money or a job title as proof.</li>
            <li>
              Post private facts or names without a check and clear say-so.
            </li>
            <li>Let AI decide who is right or who gets banned.</li>
            <li>Use the work to sell, recruit or build a following.</li>
          </ul>
        </article>
      </section>

      <section
        className="page-section evidence-rule"
        aria-labelledby="evidence-rule-title"
      >
        <Scale aria-hidden="true" />
        <div>
          <p className="eyebrow">When people disagree</p>
          <h2 id="evidence-rule-title">
            Ask for proof. Do not start a pile-on.
          </h2>
          <p>
            You do not have to swallow a news story whole. Ask for a source. Say
            why you think a claim is wrong. Let others answer. Fix the page if
            the facts change.
          </p>
          <p>
            Race, class, sex and disability can all hit one person at once. Some
            call this intersectionality. We look at how the harms stack up, and
            we still check each claim.
          </p>
        </div>
      </section>

      <section
        className="page-section membership-rule"
        aria-labelledby="membership-title"
      >
        <Shield aria-hidden="true" />
        <div>
          <h2 id="membership-title">Who can help</h2>
          <p>
            Anyone can read. To help with the work, you must keep these rules.
          </p>
          <p>
            If we turn you down, we must say which rule we used. You may ask
            someone else to check our choice. We never turn someone away because
            of who they are.
          </p>
          <p className="source-note">
            UK law also sets rules on unfair treatment. Read the{' '}
            <a href="https://www.gov.uk/discrimination-your-rights">
              government guide
            </a>{' '}
            and get legal help before using this page as a formal policy.
          </p>
          <Link className="repair-link" href="/appeal">
            Ask us to check or fix a choice
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
