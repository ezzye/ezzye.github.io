import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { canonicalPublicRedirect } from '@/lib/site-origin';

export function proxy(request: NextRequest) {
  const destination = canonicalPublicRedirect(
    request.url,
    request.headers.get('host'),
  );
  return destination
    ? NextResponse.redirect(destination, 308)
    : NextResponse.next();
}

export const config = { matcher: '/:path*' };
