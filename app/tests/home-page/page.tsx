import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ActionResponseForm } from '@/components/action-response-form';
import { SiteShell } from '@/components/site-shell';
import { getPublicRepairBundle } from '@/db/queries';

export const metadata: Metadata = {
  title: 'Does the home page make sense?',
  description: 'A private preview of the first ten-minute site test.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function HomePageTest() {
  const bundle = await getPublicRepairBundle('read-the-home-page');
  const action = bundle?.actions.find(
    (item) =>
      item.participationMode === 'direct_response' &&
      item.responsePath === '/tests/home-page',
  );
  if (!action) notFound();

  const isOpen =
    !action.isPreview &&
    (action.status === 'ready' || action.status === 'offered');
  const disabledReason = action.isPreview
    ? 'Owner-only preview. Answers are off. Do not invite testers yet.'
    : isOpen
      ? undefined
      : 'This test is closed. Answers are not being accepted.';

  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">
          {action.isPreview ? 'Owner-only preview' : '10-minute test'}
        </p>
        <h1>Does the home page make sense?</h1>
        <p>
          Open the home page in a new tab. Look at it without reading the plan.
          Then give five short answers. We are testing the page, not you.
        </p>
      </header>

      <section className="page-section test-page-grid">
        <aside className="test-boundaries" aria-label="Before you start">
          <p className="plain-kicker">Before you start</p>
          <h2>Short, private and safe.</h2>
          <ul>
            <li>{action.timeSize}</li>
            <li>{action.compensation}</li>
            <li>Adults only for this first check</li>
            <li>No name, email, diagnosis or case details</li>
            <li>No screen, voice or face recording</li>
          </ul>
          <p>
            Full answers stay private. Nameless public totals or a short
            nameless summary are a separate choice.
          </p>
        </aside>
        <ActionResponseForm
          actionId={action.id}
          questions={action.responseQuestions}
          disabledReason={disabledReason}
        />
      </section>
    </SiteShell>
  );
}
