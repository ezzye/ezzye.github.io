import { normalizeRetentionCronSecret } from '../../../lib/retention-cron-auth.ts';

export type RetentionTimerEnv = {
  RETENTION_ENDPOINT_URL: string;
  RETENTION_CRON_SECRET: string;
};

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function checkedEndpoint(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'codingforjustice.org.uk' ||
    url.pathname !== '/api/internal/retention' ||
    url.search ||
    url.hash
  ) {
    throw new Error('The retention endpoint is not the approved HTTPS route.');
  }
  return url.toString();
}

export async function sendRetentionHeartbeat(
  environment: RetentionTimerEnv,
  fetcher: Fetcher = fetch,
): Promise<void> {
  const secret = normalizeRetentionCronSecret(
    environment.RETENTION_CRON_SECRET,
  );
  if (!secret) throw new Error('The retention timer secret is not valid.');
  const response = await fetcher(
    checkedEndpoint(environment.RETENTION_ENDPOINT_URL),
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${secret}`,
      },
      redirect: 'error',
    },
  );
  if (!response.ok) {
    throw new Error(`The Site retention check returned ${response.status}.`);
  }
}

export default {
  scheduled(
    _controller: ScheduledController,
    environment: RetentionTimerEnv,
    context: ExecutionContext,
  ) {
    context.waitUntil(sendRetentionHeartbeat(environment));
  },
} satisfies ExportedHandler<RetentionTimerEnv>;
