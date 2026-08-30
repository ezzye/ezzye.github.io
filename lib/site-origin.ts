export const PUBLIC_HOST = 'codingforjustice.org.uk';
export const WWW_PUBLIC_HOST = `www.${PUBLIC_HOST}`;
export const PUBLIC_ORIGIN = `https://${PUBLIC_HOST}`;
export const SITES_GENERATED_HOST = 'coding-for-justice.ezzye.chatgpt.site';

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
