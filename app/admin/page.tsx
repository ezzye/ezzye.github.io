import type { Metadata } from 'next';
import Link from 'next/link';

import { requireChatGPTUser, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { AdminDashboard } from '@/components/admin-dashboard';
import { SiteShell } from '@/components/site-shell';
import {
  getAdminAppeals,
  getAdminActionResponses,
  getAdminProposals,
  getAdminStewardBriefs,
  getCurrentRepairBundle,
} from '@/db/queries';
import { adminIsConfigured, getAdminUser } from '@/lib/admin';

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

  const bundle = await getCurrentRepairBundle();
  const [proposals, appeals, stewardBriefs, actionResponses] =
    await Promise.all([
      getAdminProposals(),
      getAdminAppeals(),
      getAdminStewardBriefs(bundle.repair.id),
      getAdminActionResponses(bundle.repair.id),
    ]);

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
          proposals={proposals}
          appeals={appeals}
          stewardBriefs={stewardBriefs}
        />
      </section>
    </SiteShell>
  );
}
