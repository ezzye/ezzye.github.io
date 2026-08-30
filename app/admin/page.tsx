import type { Metadata } from 'next';
import Link from 'next/link';

import { requireChatGPTUser, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { AdminDashboard } from '@/components/admin-dashboard';
import { SiteShell } from '@/components/site-shell';
import {
  getAdminAppeals,
  getAdminActionInvites,
  getAdminActionResponses,
  getAdminWorkBundle,
  getAdminRetentionEvents,
  getAdminRetentionSweep,
  getAdminProposals,
  getAdminStewardBriefs,
  purgeDueActionResponses,
} from '@/db/queries';
import { adminIsConfigured, getAdminUser } from '@/lib/admin';
import {
  getPilotInviteAuthorization,
  getPilotPrivacyConfiguration,
  getPublicContactEmail,
  pilotInvitesAreAuthorized,
  pilotPrivacyIsReady,
  pilotTermsAreApproved,
  publicIntakeIsOpen,
} from '@/lib/public-intake';
import { retentionHeartbeatState } from '@/lib/retention-health';

export const metadata: Metadata = { title: 'Protected workshop' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const signedIn = await requireChatGPTUser('/admin');

  if (!adminIsConfigured()) {
    return (
      <SiteShell>
        <section className="page-section admin-gate">
          <p className="eyebrow">Protected workshop</p>
          <h1>One configuration step remains.</h1>
          <p>
            The site has verified you as {signedIn.email}, but no administrator
            email has been configured for this deployment.
          </p>
        </section>
      </SiteShell>
    );
  }

  const admin = await getAdminUser();
  if (!admin) {
    return (
      <SiteShell>
        <section className="page-section admin-gate">
          <p className="eyebrow">Protected workshop</p>
          <h1>This account is not the workshop administrator.</h1>
          <p>
            Signed in as {signedIn.email}. Private records have not been loaded.
          </p>
          <Link className="repair-link" href={chatGPTSignOutPath('/admin')}>
            Sign out and use the configured account
          </Link>
        </section>
      </SiteShell>
    );
  }

  await purgeDueActionResponses();
  const bundle = await getAdminWorkBundle();
  const [
    proposals,
    appeals,
    stewardBriefs,
    actionResponses,
    actionInvites,
    retentionEvents,
    retentionSweep,
  ] = await Promise.all([
    getAdminProposals(),
    getAdminAppeals(),
    getAdminStewardBriefs(bundle.repair.id),
    getAdminActionResponses(bundle.repair.id),
    getAdminActionInvites(bundle.repair.id),
    getAdminRetentionEvents(),
    getAdminRetentionSweep(),
  ]);
  const pilotAction = bundle.actions.find(
    (action) => action.participationMode === 'direct_response',
  );

  return (
    <SiteShell>
      <header className="page-hero compact-hero admin-hero">
        <p className="eyebrow">Protected workshop</p>
        <h1>Human review and repair control</h1>
        <p>
          Signed in as {admin.email}. Private records stay on this page and must
          never be copied into public drafts or AI tools without explicit
          consent.
        </p>
      </header>
      <section className="page-section">
        <AdminDashboard
          repair={bundle.repair}
          actions={bundle.actions}
          actionResponses={actionResponses}
          retentionEvents={retentionEvents}
          retentionSweep={retentionSweep}
          retentionHeartbeatState={retentionHeartbeatState(retentionSweep)}
          outcomes={bundle.outcomes}
          updates={bundle.updates}
          actionInvites={actionInvites}
          proposals={proposals}
          appeals={appeals}
          stewardBriefs={stewardBriefs}
          publicContactEmail={getPublicContactEmail()}
          pilotPrivacy={getPilotPrivacyConfiguration()}
          pilotPrivacyReady={pilotPrivacyIsReady(pilotAction?.reviewDate)}
          pilotInviteAuthorization={getPilotInviteAuthorization()}
          pilotInvitesAuthorized={pilotInvitesAreAuthorized()}
          pilotTermsApproved={Boolean(
            pilotAction && pilotTermsAreApproved(pilotAction),
          )}
          publicIntakeOpen={publicIntakeIsOpen()}
        />
      </section>
    </SiteShell>
  );
}
