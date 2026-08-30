const SECRET_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;
const BEARER_PATTERN = /^Bearer ([A-Za-z0-9_-]+)$/;

export function normalizeRetentionCronSecret(
  value: string | undefined,
): string | null {
  const normalized = value?.trim() ?? '';
  return SECRET_PATTERN.test(normalized) ? normalized : null;
}

async function digest(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index]! ^ right[index]!;
  }
  return difference === 0;
}

export async function retentionCronRequestIsAuthorized(
  configuredSecret: string | undefined,
  authorizationHeader: string | null,
): Promise<boolean> {
  const expected = normalizeRetentionCronSecret(configuredSecret);
  const supplied = normalizeRetentionCronSecret(
    BEARER_PATTERN.exec(authorizationHeader ?? '')?.[1],
  );
  if (!expected || !supplied) return false;
  const [expectedDigest, suppliedDigest] = await Promise.all([
    digest(expected),
    digest(supplied),
  ]);
  return sameBytes(expectedDigest, suppliedDigest);
}
