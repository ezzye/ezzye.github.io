import { env } from 'cloudflare:workers';

async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function allowRequest(
  request: Request,
  scope: string,
  limit = 5,
  windowSeconds = 60 * 60,
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSeconds;
  const source =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'local-preview';
  const bucket = Math.floor(now / windowSeconds);
  const key = await digest(`coding-for-justice:${scope}:${bucket}:${source}`);

  await env.DB.prepare(`DELETE FROM rate_limits WHERE reset_at < ?`)
    .bind(now)
    .run();

  const existing = await env.DB.prepare(
    `SELECT count, reset_at FROM rate_limits WHERE key = ?`,
  )
    .bind(key)
    .first<{ count: number; reset_at: number }>();

  if (existing && existing.reset_at >= now && existing.count >= limit)
    return false;

  if (existing) {
    await env.DB.prepare(
      `UPDATE rate_limits SET count = count + 1, reset_at = ? WHERE key = ?`,
    )
      .bind(resetAt, key)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)`,
    )
      .bind(key, resetAt)
      .run();
  }

  return true;
}
