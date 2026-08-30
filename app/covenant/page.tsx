import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Scale, Shield, X } from 'lucide-react';

import { SiteShell } from '@/components/site-shell';

export const metadata: Metadata = {
  title: 'Community covenant',
  description:
    'The beliefs, behaviours, evidence rules and appeal rights that protect the workshop.',
};

export default function CovenantPage() {
  return (
    <SiteShell>
      <header className="page-hero covenant-hero">
        <p className="eyebrow">Covenant · version 2026-08-30-v1</p>
        <h1>A wall around the work, with a door for evidence.</h1>
        <p>
          Coding for Justice is not a neutral attention market. It is a
          protected working community for people committed to dignity,
          diversity, equity, inclusion and practical fairness.
        </p>
      </header>

      <section
        className="page-section founding-affirmation"
        aria-labelledby="affirmation-title"
      >
        <p className="eyebrow">Our founding affirmation</p>
        <h2 id="affirmation-title">
          Jason Arday was unable to speak as a child, defied the odds and became
          a Black Cambridge professor — deservedly so.
        </h2>
        <p>
          This is our declared direction of travel: human possibility must not
          be priced by an early label, class, race, disability or another
          person’s estimate. It is a values test for joining the workshop, not
          permission to suspend evidence, treat a living person as a mascot, or
          demand agreement with every story ever told about him.
        </p>
        <p className="source-note">
          The factual core is supported by the University of Cambridge’s{' '}
          <a href="https://news.educ.cam.ac.uk/230223-jason-arday">
            appointment announcement
          </a>{' '}
          and{' '}
          <a href="https://faculty.educ.cam.ac.uk/people/staff/arday/">
            faculty profile
          </a>
          . “Deservedly so” is our explicit moral judgement.
        </p>
      </section>

      <section
        className="page-section covenant-columns"
        aria-label="Covenant behaviours"
      >
        <article className="covenant-positive">
          <Check aria-hidden="true" />
          <h2>Required</h2>
          <ul>
            <li>
              Affirm DEI and the equal dignity of people across protected
              characteristics.
            </li>
            <li>
              Listen to affected people without requiring them to perform
              trauma.
            </li>
            <li>
              Separate known facts, reported experience, inference, disagreement
              and uncertainty.
            </li>
            <li>Challenge systems and claims without humiliating people.</li>
            <li>
              Accept proportionate safeguards, review dates, corrections and
              stop rules.
            </li>
            <li>
              Share credit, respect access needs and make space for quiet
              contribution.
            </li>
          </ul>
        </article>
        <article className="covenant-negative">
          <X aria-hidden="true" />
          <h2>Not welcome</h2>
          <ul>
            <li>
              Racism, ableism, sexism, class contempt, homophobia, transphobia
              or religious hatred.
            </li>
            <li>
              Media bullying, dog-piling, doxxing, harassment or mobilisation
              against a person.
            </li>
            <li>
              Using popularity, celebrity, wealth or institutional status as
              proof.
            </li>
            <li>
              Publishing private material, accusations or identifying details
              without review and consent.
            </li>
            <li>
              AI-generated verdicts, automated moderation decisions or
              undisclosed synthetic testimony.
            </li>
            <li>
              Hijacking a repair to recruit, advertise, fundraise or build a
              personal following.
            </li>
          </ul>
        </article>
      </section>

      <section
        className="page-section evidence-rule"
        aria-labelledby="evidence-rule-title"
      >
        <Scale aria-hidden="true" />
        <div>
          <p className="eyebrow">Belief without credulity</p>
          <h2 id="evidence-rule-title">Fair people can investigate a claim.</h2>
          <p>
            The covenant rejects automatic belief in media narratives as well as
            automatic disbelief of marginalised people. A participant may ask
            for a source, contest an inference or change their mind. The test is
            how they do it: specific evidence, proportionate language, no
            pile-on, a chance to respond, and a visible correction if the record
            changes.
          </p>
          <p>
            Intersectionality is a lens, not a membership label: we examine how
            overlapping systems such as race, class, disability and gender can
            compound a barrier, while still judging the evidence in the repair
            at hand.
          </p>
        </div>
      </section>

      <section
        className="page-section membership-rule"
        aria-labelledby="membership-title"
      >
        <Shield aria-hidden="true" />
        <div>
          <h2 id="membership-title">
            Participation is conditional on conduct.
          </h2>
          <p>
            Anyone may read the public ledger. Offering help or entering the
            protected workshop requires this covenant. A boundary decision must
            cite a rule, preserve privacy and be open to an independent appeal.
            We do not exclude someone because of a protected characteristic.
          </p>
          <p>
            The UK Equality Act protects people from discrimination and permits
            proportionate positive action in defined circumstances. Read the{' '}
            <a href="https://www.gov.uk/discrimination-your-rights">
              government overview
            </a>{' '}
            and seek qualified advice before applying this policy as employment,
            membership or service law.
          </p>
          <Link className="repair-link" href="/appeal">
            Request a correction or independent review
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
