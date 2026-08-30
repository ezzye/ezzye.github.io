import vinextHandler from 'vinext/server/fetch-handler';

import { runScheduledActionResponseRetention } from '@/db/queries';
import {
  isChatGPTSignOutRequest,
  prepareAuthenticatedRequest,
  privateCanaryAuthIsEnabled,
  privateCanaryDeniedResponse,
  privateCanaryLogoutResponse,
  privateCanaryResponse,
} from '@/lib/cloudflare-access';
import { generatedSiteResponse } from '@/lib/site-origin';

export default {
  async fetch(
    request: Request,
    environment: Cloudflare.Env,
    context: ExecutionContext,
  ) {
    const configuredGate = environment.AUTH_GATE?.trim();
    if (!configuredGate) {
      const response = await vinextHandler.fetch(request, environment, context);
      return generatedSiteResponse(request, response);
    }
    if (!privateCanaryAuthIsEnabled(environment)) {
      return privateCanaryDeniedResponse();
    }
    if (isChatGPTSignOutRequest(request)) {
      return privateCanaryLogoutResponse(request);
    }

    let authenticatedRequest: Request;
    try {
      authenticatedRequest = await prepareAuthenticatedRequest(
        request,
        environment,
      );
    } catch {
      return privateCanaryDeniedResponse();
    }

    const response = await vinextHandler.fetch(
      authenticatedRequest,
      environment,
      context,
    );
    return privateCanaryResponse(response);
  },

  scheduled(
    _controller: ScheduledController,
    environment: Cloudflare.Env,
    context: ExecutionContext,
  ) {
    context.waitUntil(runScheduledActionResponseRetention(environment.DB));
  },
} satisfies ExportedHandler<Cloudflare.Env>;
