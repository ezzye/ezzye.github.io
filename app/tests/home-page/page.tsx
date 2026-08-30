import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ActionResponseForm } from '@/components/action-response-form';
import { SiteShell } from '@/components/site-shell';
import {
  getActionInviteState,
  getActionResponseRetentionSweep,
  getPublicRepairBundle,
} from '@/db/queries';
import {
  actionInviteTokenLooksValid,
  hashActionInviteToken,
} from '@/lib/action-invites';
import { pilotRuntimeIsReady } from '@/lib/public-intake';

export const metadata: Metadata = {
  title: 'Does the home page make sense?',
  description: 'A private preview of the first ten-minute site test.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export const dynamic = 'force-dynamic';

export default async function HomePageTest({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string | string[] }>;
}) {
  const [bundle, retentionSweep] = await Promise.all([
    getPublicRepairBundle('read-the-home-page'),
    getActionResponseRetentionSweep(),
  ]);
  const action = bundle?.actions.find(
    (item) =>
      item.participationMode === 'direct_response' &&
      item.responsePath === '/tests/home-page',
  );
  if (!action) notFound();

  const params = await searchParams;
  const inviteToken =
    typeof params.invite === 'string' ? params.invite.trim() : '';
  const runtimeReady = pilotRuntimeIsReady(action, retentionSweep);
  const inviteState =
    runtimeReady &&
    !action.isPreview &&
    actionInviteTokenLooksValid(inviteToken)
      ? await getActionInviteState(
          action.id,
          await hashActionInviteToken(inviteToken),
        )
      : 'invalid';

  const isOpen =
    runtimeReady &&
    !action.isPreview &&
    (action.status === 'ready' || action.status === 'offered') &&
    inviteState === 'valid';
  const disabledReason = !runtimeReady
    ? 'This test is still being checked. Answers are off.'
    : action.isPreview
      ? 'Owner-only preview. Answers are off. Do not invite testers yet.'
      : action.status !== 'ready' && action.status !== 'offered'
        ? 'This test is closed. Answers are not being accepted.'
        : !inviteToken
          ? 'This test is invitation-only. Use the full private link you were sent.'
          : inviteState === 'used'
            ? 'That one-use link has already been used. Ask for a fresh link if you still need one.'
            : inviteState === 'expired'
              ? 'That link has expired. Ask for a fresh link.'
              : inviteState === 'revoked'
                ? 'That link has been stopped. Ask for a fresh link.'
                : inviteState === 'valid'
                  ? undefined
                  : 'That invitation link is not valid. Ask for a fresh link.';

  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">
          {action.isPreview
            ? 'Owner-only preview'
            : isOpen
              ? 'Private 10-minute test'
              : 'Invitation needed'}
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
            Full answers stay private and cannot be the source of a public
            result.
          </p>
        </aside>
        <ActionResponseForm
          actionId={action.id}
          inviteToken={isOpen ? inviteToken : undefined}
          questions={action.responseQuestions}
          disabledReason={disabledReason}
        />
      </section>
    </SiteShell>
  );
}
