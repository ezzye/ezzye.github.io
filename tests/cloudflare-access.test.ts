import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTVerifyGetKey,
} from 'jose';

import {
  CloudflareAccessDenied,
  parseCloudflareAccessTeamOrigin,
  prepareAuthenticatedRequest,
  privateCanaryDeniedResponse,
  privateCanaryLogoutResponse,
  privateCanaryResponse,
} from '../lib/cloudflare-access.ts';

const issuer = 'https://justice-test.cloudflareaccess.com';
const audience = 'private-canary-audience';
const accessEnvironment = {
  AUTH_GATE: 'cloudflare-access',
  CF_ACCESS_TEAM_DOMAIN: issuer,
  CF_ACCESS_AUD: audience,
};

const { privateKey, publicKey } = await generateKeyPair('RS256');
const publicJwk = await exportJWK(publicKey);
publicJwk.alg = 'RS256';
publicJwk.kid = 'local-test-key';
publicJwk.use = 'sig';
const verificationKey: JWTVerifyGetKey = createLocalJWKSet({
  keys: [publicJwk],
});

type TokenOptions = {
  tokenAudience?: string;
  tokenIssuer?: string;
  expiresIn?: string;
  includeEmail?: boolean;
  includeExpiration?: boolean;
  includeIssuedAt?: boolean;
  subject?: string | null;
  tokenType?: string;
  signingKey?: CryptoKey;
};

async function accessToken({
  tokenAudience = audience,
  tokenIssuer = issuer,
  expiresIn = '5m',
  includeEmail = true,
  includeExpiration = true,
  includeIssuedAt = true,
  subject = 'access-user-123',
  tokenType = 'app',
  signingKey = privateKey,
}: TokenOptions = {}): Promise<string> {
  const claims: Record<string, string> = {
    name: 'Test Owner',
    type: tokenType,
  };
  if (includeEmail) claims.email = 'OWNER@example.test';

  const token = new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'local-test-key' })
    .setIssuer(tokenIssuer)
    .setAudience(tokenAudience);
  if (subject !== null) token.setSubject(subject);
  if (includeIssuedAt) token.setIssuedAt();
  if (includeExpiration) token.setExpirationTime(expiresIn);
  return token.sign(signingKey);
}

function requestWithToken(token: string): Request {
  return new Request('https://canary.example.test/admin', {
    headers: {
      'Cf-Access-Jwt-Assertion': token,
      'oai-authenticated-extra-spoof': 'must disappear',
      'oai-authenticated-user-email': 'attacker@example.test',
      'oai-authenticated-user-id': 'attacker',
    },
  });
}

void test('uses only a verified Access token to create internal user headers', async () => {
  const prepared = await prepareAuthenticatedRequest(
    requestWithToken(await accessToken()),
    accessEnvironment,
    { verificationKey },
  );

  assert.equal(prepared.headers.get('cf-access-jwt-assertion'), null);
  assert.equal(prepared.headers.get('oai-authenticated-extra-spoof'), null);
  assert.equal(
    prepared.headers.get('oai-authenticated-user-id'),
    'access-user-123',
  );
  assert.equal(
    prepared.headers.get('oai-authenticated-user-email'),
    'owner@example.test',
  );
  assert.equal(
    decodeURIComponent(
      prepared.headers.get('oai-authenticated-user-full-name') ?? '',
    ),
    'Test Owner',
  );
  assert.equal(
    prepared.headers.get('oai-authenticated-user-full-name-encoding'),
    'percent-encoded-utf-8',
  );
});

void test('leaves the existing Sites request untouched when no gate is set', async () => {
  const request = new Request('https://site.example.test/admin', {
    headers: { 'oai-authenticated-user-id': 'sites-owner' },
  });
  assert.equal(await prepareAuthenticatedRequest(request, {}), request);
});

void test('keeps the original request body, method, URL and ordinary headers', async () => {
  const request = new Request('https://canary.example.test/api/check?one=1', {
    method: 'POST',
    headers: {
      'Cf-Access-Jwt-Assertion': await accessToken(),
      'Content-Type': 'application/json',
      'X-Keep-Me': 'yes',
    },
    body: JSON.stringify({ invented: true }),
  });
  const prepared = await prepareAuthenticatedRequest(
    request,
    accessEnvironment,
    { verificationKey },
  );
  assert.equal(prepared.method, 'POST');
  assert.equal(prepared.url, 'https://canary.example.test/api/check?one=1');
  assert.equal(prepared.headers.get('x-keep-me'), 'yes');
  assert.deepEqual(await prepared.json(), { invented: true });
});

void test('rejects expired, wrong-audience, wrong-issuer and incomplete tokens', async (t) => {
  const rejectedTokens = [
    await accessToken({ expiresIn: '0s' }),
    await accessToken({ tokenAudience: 'wrong-audience' }),
    await accessToken({
      tokenIssuer: 'https://different.cloudflareaccess.com',
    }),
    await accessToken({ includeEmail: false }),
    await accessToken({ tokenType: 'org' }),
    await accessToken({ includeExpiration: false }),
    await accessToken({ includeIssuedAt: false }),
    await accessToken({ subject: null }),
    await accessToken({ subject: '   ' }),
  ];

  for (const [index, token] of rejectedTokens.entries()) {
    await t.test(`bad token ${index + 1}`, async () => {
      await assert.rejects(
        prepareAuthenticatedRequest(
          requestWithToken(token),
          accessEnvironment,
          { verificationKey },
        ),
        CloudflareAccessDenied,
      );
    });
  }
});

void test('rejects missing assertions and tokens signed by a different key', async () => {
  await assert.rejects(
    prepareAuthenticatedRequest(
      new Request('https://canary.example.test/'),
      accessEnvironment,
      { verificationKey },
    ),
    CloudflareAccessDenied,
  );

  const { privateKey: wrongPrivateKey } = await generateKeyPair('RS256');
  await assert.rejects(
    prepareAuthenticatedRequest(
      requestWithToken(await accessToken({ signingKey: wrongPrivateKey })),
      accessEnvironment,
      { verificationKey },
    ),
    CloudflareAccessDenied,
  );
});

void test('rejects missing or malformed Access settings and unknown gates', async () => {
  const tokenRequest = requestWithToken(await accessToken());
  await assert.rejects(
    prepareAuthenticatedRequest(
      tokenRequest,
      { ...accessEnvironment, CF_ACCESS_AUD: '' },
      { verificationKey },
    ),
    CloudflareAccessDenied,
  );
  await assert.rejects(
    prepareAuthenticatedRequest(
      tokenRequest,
      {
        ...accessEnvironment,
        CF_ACCESS_TEAM_DOMAIN:
          'https://justice-test.cloudflareaccess.com.attacker.example',
      },
      { verificationKey },
    ),
    CloudflareAccessDenied,
  );
  await assert.rejects(
    prepareAuthenticatedRequest(
      tokenRequest,
      { ...accessEnvironment, AUTH_GATE: 'unknown-gate' },
      { verificationKey },
    ),
    CloudflareAccessDenied,
  );

  assert.equal(
    parseCloudflareAccessTeamOrigin(
      'https://justice-test.cloudflareaccess.com/',
    ),
    issuer,
  );
  for (const badDomain of [
    'http://justice-test.cloudflareaccess.com',
    'https://justice-test.cloudflareaccess.com/path',
    'https://user@justice-test.cloudflareaccess.com',
    ' https://justice-test.cloudflareaccess.com',
  ]) {
    assert.throws(
      () => parseCloudflareAccessTeamOrigin(badDomain),
      CloudflareAccessDenied,
    );
  }
});

void test('returns plain, uncacheable and unindexed private-canary responses', async () => {
  const denied = privateCanaryDeniedResponse();
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('cache-control'), 'no-store');
  assert.equal(denied.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.doesNotMatch(await denied.text(), /token|issuer|audience|jwt/i);

  const protectedResponse = privateCanaryResponse(
    new Response('owner page', { headers: { 'X-Test': 'kept' } }),
  );
  assert.equal(protectedResponse.headers.get('x-test'), 'kept');
  assert.equal(
    protectedResponse.headers.get('cache-control'),
    'private, no-store',
  );
  assert.equal(
    protectedResponse.headers.get('x-robots-tag'),
    'noindex, nofollow',
  );

  const logout = privateCanaryLogoutResponse(
    new Request(
      'https://coding-for-justice-private-canary.example.workers.dev/signout-with-chatgpt',
    ),
  );
  assert.equal(logout.status, 302);
  assert.equal(
    logout.headers.get('location'),
    'https://coding-for-justice-private-canary.example.workers.dev/cdn-cgi/access/logout',
  );
  assert.equal(logout.headers.get('cache-control'), 'no-store');
});
