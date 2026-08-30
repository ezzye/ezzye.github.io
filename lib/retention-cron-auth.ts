const MINIMUM_SECRET_LENGTH = 43;
const MAXIMUM_SECRET_LENGTH = 128;
const BEARER_PATTERN = /^Bearer ([A-Za-z0-9_-]+)$/;

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
  const expected = configuredSecret?.trim() ?? '';
  const supplied = BEARER_PATTERN.exec(authorizationHeader ?? '')?.[1] ?? '';
  if (
    expected.length < MINIMUM_SECRET_LENGTH ||
    expected.length > MAXIMUM_SECRET_LENGTH ||
    supplied.length < MINIMUM_SECRET_LENGTH ||
    supplied.length > MAXIMUM_SECRET_LENGTH
  ) {
    return false;
  }
  const [expectedDigest, suppliedDigest] = await Promise.all([
    digest(expected),
    digest(supplied),
  ]);
  return sameBytes(expectedDigest, suppliedDigest);
}
