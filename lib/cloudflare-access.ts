import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
  type JWTPayload,
} from 'jose';

export const CLOUDFLARE_ACCESS_GATE = 'cloudflare-access';

const ACCESS_ASSERTION_HEADER = 'cf-access-jwt-assertion';
const INTERNAL_USER_HEADER_PREFIX = 'oai-authenticated-';
const USER_ID_HEADER = `${INTERNAL_USER_HEADER_PREFIX}user-id`;
const USER_EMAIL_HEADER = `${INTERNAL_USER_HEADER_PREFIX}user-email`;
const USER_FULL_NAME_HEADER = `${INTERNAL_USER_HEADER_PREFIX}user-full-name`;
const USER_FULL_NAME_ENCODING_HEADER = `${INTERNAL_USER_HEADER_PREFIX}user-full-name-encoding`;
const PERCENT_ENCODED_UTF8 = 'percent-encoded-utf-8';

type AccessEnvironment = {
  AUTH_GATE?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
};

type AccessClaims = JWTPayload & {
  email?: unknown;
  name?: unknown;
  type?: unknown;
};

export type AccessVerificationOptions = Readonly<{
  verificationKey?: JWTVerifyGetKey;
  currentDate?: Date;
}>;

const remoteKeySets = new Map<string, JWTVerifyGetKey>();

export class CloudflareAccessDenied extends Error {
  constructor() {
    super('Cloudflare Access denied');
    this.name = 'CloudflareAccessDenied';
  }
}

export function privateCanaryAuthIsEnabled(
  environment: AccessEnvironment,
): boolean {
  return environment.AUTH_GATE?.trim() === CLOUDFLARE_ACCESS_GATE;
}

export async function prepareAuthenticatedRequest(
  request: Request,
  environment: AccessEnvironment,
  options: AccessVerificationOptions = {},
): Promise<Request> {
  const gate = environment.AUTH_GATE?.trim();
  if (!gate) return request;
  if (gate !== CLOUDFLARE_ACCESS_GATE) throw new CloudflareAccessDenied();

  const token = request.headers.get(ACCESS_ASSERTION_HEADER)?.trim();
  const audience = environment.CF_ACCESS_AUD?.trim();
  const issuer = parseCloudflareAccessTeamOrigin(
    environment.CF_ACCESS_TEAM_DOMAIN,
  );
  if (!token || !audience) throw new CloudflareAccessDenied();

  let payload: AccessClaims;
  try {
    const verified = await jwtVerify<AccessClaims>(
      token,
      options.verificationKey ?? remoteKeySet(issuer),
      {
        algorithms: ['RS256'],
        audience,
        currentDate: options.currentDate,
        issuer,
        requiredClaims: ['exp', 'iat', 'sub', 'email', 'type'],
      },
    );
    payload = verified.payload;
  } catch {
    throw new CloudflareAccessDenied();
  }

  const userId = cleanClaim(payload.sub);
  const email = cleanClaim(payload.email);
  const fullName = cleanClaim(payload.name);
  if (!userId || !email || payload.type !== 'app') {
    throw new CloudflareAccessDenied();
  }

  const headers = new Headers(request.headers);
  const spoofedHeaders = Array.from(headers.keys()).filter((name) =>
    name.toLowerCase().startsWith(INTERNAL_USER_HEADER_PREFIX),
  );
  for (const name of spoofedHeaders) {
    headers.delete(name);
  }
  headers.delete(ACCESS_ASSERTION_HEADER);
  headers.set(USER_ID_HEADER, userId);
  headers.set(USER_EMAIL_HEADER, email.toLowerCase());
  if (fullName) {
    headers.set(USER_FULL_NAME_HEADER, encodeURIComponent(fullName));
    headers.set(USER_FULL_NAME_ENCODING_HEADER, PERCENT_ENCODED_UTF8);
  }

  return new Request(request, { headers });
}

export function privateCanaryResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export function privateCanaryDeniedResponse(): Response {
  return new Response('This private test is not open to this request.', {
    status: 403,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export function privateCanaryLogoutResponse(request: Request): Response {
  const logoutUrl = new URL('/cdn-cgi/access/logout', request.url);
  return new Response(null, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store',
      Location: logoutUrl.toString(),
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export function isChatGPTSignOutRequest(request: Request): boolean {
  return new URL(request.url).pathname === '/signout-with-chatgpt';
}

export function parseCloudflareAccessTeamOrigin(value: unknown): string {
  if (typeof value !== 'string' || value !== value.trim() || !value) {
    throw new CloudflareAccessDenied();
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new CloudflareAccessDenied();
  }

  const labels = url.hostname.toLowerCase().split('.');
  const validHostname =
    labels.length >= 3 &&
    labels.at(-2) === 'cloudflareaccess' &&
    labels.at(-1) === 'com' &&
    labels
      .slice(0, -2)
      .every((label) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));

  if (
    url.protocol !== 'https:' ||
    !validHostname ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new CloudflareAccessDenied();
  }

  return url.origin;
}

function remoteKeySet(issuer: string): JWTVerifyGetKey {
  const existing = remoteKeySets.get(issuer);
  if (existing) return existing;

  const keySet = createRemoteJWKSet(
    new URL('/cdn-cgi/access/certs', `${issuer}/`),
  );
  remoteKeySets.set(issuer, keySet);
  return keySet;
}

function cleanClaim(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned || null;
}
