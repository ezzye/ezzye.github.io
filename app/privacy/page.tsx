import type { Metadata } from 'next';

import { SiteShell } from '@/components/site-shell';
import {
  getPilotPrivacyConfiguration,
  getPublicContactEmail,
  getPublicDataOwner,
  getPublicPrivacyReplyTime,
  pilotPrivacyIsReady,
} from '@/lib/public-intake';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What we keep, why we keep it and what stays off the site.',
};
export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  const contactEmail = getPublicContactEmail();
  const dataOwner = getPublicDataOwner();
  const replyTime = getPublicPrivacyReplyTime();
  const pilotPrivacy = getPilotPrivacyConfiguration();
  const pilotReady = pilotPrivacyIsReady();
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">Privacy</p>
        <h1>Private means private.</h1>
        <p>
          Your full form answer does not go online and cannot be the source of a
          public result. This site has no public accounts, comments, trackers or
          file uploads.
        </p>
      </header>
      <section className="page-section prose-page">
        <h2>What we keep</h2>
        <p>
          We keep what you type in a form, your choices and your email if you
          give it to us. The home-page test asks for no name or email. We also
          keep a small record to stop spam. Do not send passwords, case numbers,
          medical notes, witness statements or files.
        </p>
        <p>
          The first home-page test uses one-use links. We store a scrambled
          version of each link in the site database, whether it was used, and
          its closing time. The hosting service may also keep security and
          operating logs. The test page does not send its address on to pages
          you open from it.
        </p>
        <h2>Why we keep it</h2>
        <p>
          For the home-page test, we use answers to see whether the page is
          clear, record your choices and stop one-use links being reused. The
          test asks for no email, so we cannot reply unless you later email us
          with your reference.
        </p>
        <p>
          Future problem and review forms may use what you send to understand
          the problem, reply and plan a small job. Those forms stay shut until
          their own rules are checked. If publication is separately approved, a
          person must check it first.
        </p>
        {pilotPrivacy ? (
          <p>
            For the home-page test, the recorded legal reason (lawful basis) is:{' '}
            <strong>{pilotPrivacy.lawfulBasis}</strong>
          </p>
        ) : (
          <p>
            The lawful basis for the home-page test has not been recorded, so no
            real invitation can be used yet.
          </p>
        )}
        <h2>What may go online</h2>
        <p>
          Nothing goes online by itself. A future problem form will need its own
          checked rules before any public draft can be made.
        </p>
        <p>
          The home-page test stays private. Its answers, totals, themes and
          individual words cannot be used as the source of a public result. A
          separate public result must stand on a public evidence page that
          anyone can open without signing in.
        </p>
        <h2>AI and who else may handle the data</h2>
        <p>
          AI is off for private answers. We must name the tool, say what it will
          do and ask first before sending it anyone’s words.
        </p>
        {pilotPrivacy ? (
          <p>{pilotPrivacy.recipients}</p>
        ) : (
          <p>
            The people and services that may receive test data have not been
            recorded, so the test stays shut.
          </p>
        )}
        <h2>Retention</h2>
        {pilotPrivacy ? (
          <>
            <p>
              Full home-page test answers must be deleted by the end of{' '}
              <strong>{pilotPrivacy.responseDeleteDate}</strong> (UK time). Each
              saved answer carries that deadline. After it passes, the workshop
              will not show the answer and the next site request tries to erase
              it.
            </p>
            <p>
              The owner also has one button to stop the test and erase every
              full answer early. The deletion log keeps only the number erased
              and the dates, never the answers. Ending the private test and
              writing any public result are separate jobs.
            </p>
          </>
        ) : (
          <p>
            An exact deletion date has not been set, so the home-page test stays
            shut.
          </p>
        )}
        <p>
          Future problem and review forms need their own checked deletion rules
          before they open.
        </p>
        <h2>What you can ask us to do</h2>
        <p>
          You can ask to see, fix, limit or delete what we hold, and you can
          withdraw any consent you gave. Keep the reference from the home-page
          test: because we ask for no name or email, that is how we find your
          reply. Sometimes the law means we cannot do exactly what you ask. If
          so, we should say why.
        </p>
        <p>
          You can also complain to the{' '}
          <a href="https://ico.org.uk/make-a-complaint/data-protection-complaints/">
            Information Commissioner’s Office
          </a>
          .
        </p>
        <h2 id="contact">Who to contact</h2>
        {pilotPrivacy ? (
          <p>
            <strong>{pilotPrivacy.dataOwner}</strong> is responsible for the
            test data. Email{' '}
            <a href={`mailto:${pilotPrivacy.contactEmail}`}>
              {pilotPrivacy.contactEmail}
            </a>{' '}
            about privacy, access or deletion. The stated reply time is{' '}
            {pilotPrivacy.replyTime}.
          </p>
        ) : contactEmail && dataOwner && replyTime ? (
          <p>
            <strong>{dataOwner}</strong> is responsible for the site data.
            Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>{' '}
            about privacy, access, deletion or an access problem. We aim to
            reply {replyTime}. Forms and private tests stay shut until their
            separate privacy, permission and staffing checks are complete.
          </p>
        ) : contactEmail ? (
          <p>
            Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. The
            responsible name or reply time is still missing, so the forms and
            private test stay shut.
          </p>
        ) : (
          <p>
            No public privacy email has been set. That means the test and the
            other private forms must stay closed.
          </p>
        )}
        <h2>{pilotReady ? 'The small test' : 'Before any real invitation'}</h2>
        {pilotReady ? (
          <p>
            The privacy details for the invited home-page test are recorded.
            This does not authorise invitations or make the site or the test
            public.
          </p>
        ) : (
          <p>
            This is still a rehearsal. A named data owner, all details above and
            a full privacy check must be recorded before a real link is made. Do
            not share test links or send private case files.
          </p>
        )}
      </section>
    </SiteShell>
  );
}
