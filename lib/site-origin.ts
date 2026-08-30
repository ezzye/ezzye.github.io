export const PUBLIC_HOST = 'codingforjustice.org.uk';
export const WWW_PUBLIC_HOST = `www.${PUBLIC_HOST}`;
export const PUBLIC_ORIGIN = `https://${PUBLIC_HOST}`;
export const SITES_GENERATED_HOST = 'coding-for-justice.ezzye.chatgpt.site';

export function generatedSiteResponse(
  request: Request,
  response: Response,
): Response {
  let hostname: string;
  try {
    hostname = new URL(request.url).hostname.toLowerCase();
  } catch {
    return response;
  }
  if (hostname !== SITES_GENERATED_HOST) return response;

  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export function canonicalPublicRedirect(
  requestUrl: string,
  hostHeader: string | null,
): URL | null {
  const host = hostHeader?.trim().toLowerCase().split(':', 1)[0];
  if (host !== WWW_PUBLIC_HOST) return null;

  const destination = new URL(requestUrl);
  destination.protocol = 'https:';
  destination.host = PUBLIC_HOST;
  return destination;
}
