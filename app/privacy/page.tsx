import type { Metadata } from 'next';

import { SiteShell } from '@/components/site-shell';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What we keep, why we keep it and what stays off the site.',
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">Privacy</p>
        <h1>Private means private.</h1>
        <p>
          A form you send us does not go online. This site has no public
          accounts, comments, trackers or file uploads.
        </p>
      </header>
      <section className="page-section prose-page">
        <h2>What we keep</h2>
        <p>
          We keep what you type in a form, your choices and your email if you
          give it to us. We also keep a small record to stop spam. Do not send
          passwords, case numbers, medical notes, witness statements or files.
        </p>
        <h2>Why we keep it</h2>
        <p>
          We use it to understand the problem, reply to you, plan a small job
          and stop spam. A person checks anything before it goes online.
        </p>
        <h2>Putting words online and using AI</h2>
        <p>
          Nothing you send goes online by itself. If we make a public draft, we
          take out private facts and show it to you first. AI is off by default.
          We must name the AI tool, say what it will do and ask you before we
          send it your words.
        </p>
        <h2>Retention</h2>
        <p>
          We aim to delete work we do not take on within 90 days of the last
          check. We may keep work we do take on for up to 12 months after it
          ends, then delete it or strip out who it came from. Public proof and
          fixes may stay online while people still need them.
        </p>
        <h2>What you can ask us to do</h2>
        <p>
          You can ask to see, fix, limit or delete what we hold. Use “Ask us to
          fix a mistake”. Sometimes the law or safety rules mean we cannot
          delete it. If so, we should tell you why.
        </p>
        <h2>Before we ask real people to use this</h2>
        <p>
          We still need a named person in charge of the data, a contact address
          and a full UK GDPR check. Until then, do not send private case files.
        </p>
      </section>
    </SiteShell>
  );
}
