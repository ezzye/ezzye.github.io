const TOKEN_PATTERN = /^[a-f0-9]{48}$/;

export function createActionInviteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

export function actionInviteTokenLooksValid(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}

export async function hashActionInviteToken(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
