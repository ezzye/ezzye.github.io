import { env } from 'cloudflare:workers';

import { runScheduledActionResponseRetention } from '@/db/queries';
import { retentionCronRequestIsAuthorized } from '@/lib/retention-cron-auth';

const PRIVATE_HEADERS = {
  'cache-control': 'private, no-store',
  'x-content-type-options': 'nosniff',
  'x-robots-tag': 'noindex, nofollow',
};

export async function POST(request: Request) {
  if (
    !(await retentionCronRequestIsAuthorized(
      env.RETENTION_CRON_SECRET,
      request.headers.get('authorization'),
    ))
  ) {
    return Response.json(
      { ok: false },
      { status: 404, headers: PRIVATE_HEADERS },
    );
  }

  const sweep = await runScheduledActionResponseRetention(env.DB);
  return Response.json(
    {
      ok: true,
      completedAt: sweep.lastCompletedAt,
      recordsDeleted: sweep.lastRecordsDeleted,
    },
    { headers: PRIVATE_HEADERS },
  );
}
