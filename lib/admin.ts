import { env } from 'cloudflare:workers';

import { getChatGPTUser } from '@/app/chatgpt-auth';

export async function getAdminUser() {
  const user = await getChatGPTUser();
  const configuredEmail = env.ADMIN_EMAIL?.trim().toLowerCase();
  if (
    !user ||
    !configuredEmail ||
    user.email.toLowerCase() !== configuredEmail
  ) {
    return null;
  }
  return user;
}

export function adminIsConfigured(): boolean {
  return Boolean(env.ADMIN_EMAIL?.trim());
}
