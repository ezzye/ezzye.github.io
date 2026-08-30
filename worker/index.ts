import vinextHandler from 'vinext/server/fetch-handler';

import { runScheduledActionResponseRetention } from '@/db/queries';

export default {
  fetch(
    request: Request,
    environment: Cloudflare.Env,
    context: ExecutionContext,
  ) {
    return vinextHandler.fetch(request, environment, context);
  },

  scheduled(
    _controller: ScheduledController,
    environment: Cloudflare.Env,
    context: ExecutionContext,
  ) {
    context.waitUntil(runScheduledActionResponseRetention(environment.DB));
  },
} satisfies ExportedHandler<Cloudflare.Env>;
