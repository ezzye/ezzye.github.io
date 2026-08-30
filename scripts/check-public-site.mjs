#!/usr/bin/env node

const DIRECT_ROUTES = [
  { path: '/', type: 'text/html', marker: 'Small jobs' },
  { path: '/repairs', type: 'text/html', marker: 'fixing' },
  { path: '/outcomes', type: 'text/html', marker: 'What changed' },
  { path: '/privacy', type: 'text/html', marker: 'Private means private' },
  { path: '/archive', type: 'text/html', marker: 'We did not wipe the past' },
  { path: '/covenant', type: 'text/html', marker: 'Kind to people' },
  { path: '/accessibility', type: 'text/html', marker: 'easy to read and use' },
  { path: '/start', type: 'text/html', marker: 'form is not open yet' },
  { path: '/appeal', type: 'text/html', marker: 'review form is not open yet' },
  { path: '/feed.xml', type: 'application/rss+xml', marker: '<rss' },
  { path: '/robots.txt', type: 'text/plain', marker: 'Disallow: /admin' },
  { path: '/sitemap.xml', type: 'application/xml', marker: '<urlset' },
  { path: '/favicon.svg', type: 'image/svg+xml', marker: '<svg' },
  { path: '/og.png', type: 'image/png', marker: null },
];

const LEGACY_REDIRECTS = [
  { from: '/about/', to: '/covenant' },
  { from: '/about/contacts/', to: '/privacy#contact' },
  { from: '/about/join/', to: '/repairs' },
  {
    from: '/home/discrimination/2021/04/24/coding-for-equal-justice.html',
    to: '/archive',
  },
  {
    from: '/youtube/stop/and/search/video/2021/04/19/youtube-stop-and-search-video.html',
    to: '/archive',
  },
  {
    from: '/stop/and/search/app/2021/04/19/Idea-for-the-police-app.html',
    to: '/archive',
  },
];

const REQUIRED_SECURITY_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
];

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : (process.argv[index + 1] ?? null);
}

function usage() {
  console.log(
    'Usage: node scripts/check-public-site.mjs --origin https://example.org [--www-origin https://www.example.org] [--expect-noindex]',
  );
}

async function get(url, redirect = 'manual') {
  return fetch(url, {
    redirect,
    signal: AbortSignal.timeout(15_000),
    headers: { 'user-agent': 'Coding-for-Justice-release-check/1.0' },
  });
}

function safeOrigin(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} is not a web address.`);
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${label} must be an HTTPS origin with no path.`);
  }
  return url.origin;
}

async function main() {
  if (process.argv.includes('--help')) {
    usage();
    return;
  }

  const rawOrigin = option('--origin');
  if (!rawOrigin) {
    usage();
    process.exitCode = 2;
    return;
  }

  const origin = safeOrigin(rawOrigin, '--origin');
  const rawWwwOrigin = option('--www-origin');
  const wwwOrigin = rawWwwOrigin
    ? safeOrigin(rawWwwOrigin, '--www-origin')
    : null;
  const expectNoindex = process.argv.includes('--expect-noindex');
  const failures = [];

  for (const route of DIRECT_ROUTES) {
    try {
      const response = await get(`${origin}${route.path}`);
      if (response.status !== 200) {
        failures.push(`${route.path} returned ${response.status}, not 200.`);
      }
      if (response.headers.has('location')) {
        failures.push(`${route.path} unexpectedly redirected.`);
      }
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.toLowerCase().includes(route.type)) {
        failures.push(
          `${route.path} returned ${JSON.stringify(contentType)}, not ${route.type}.`,
        );
      }
      if (route.marker) {
        const body = await response.text();
        if (!body.includes(route.marker)) {
          failures.push(
            `${route.path} did not contain its expected page marker.`,
          );
        }
      } else {
        await response.body?.cancel();
      }
    } catch (error) {
      failures.push(`${route.path} failed: ${error.message}`);
    }
  }

  for (const route of LEGACY_REDIRECTS) {
    try {
      const expected = new URL(route.to, origin);
      let current = new URL(route.from, origin);
      let arrived = false;

      for (let hop = 1; hop <= 3; hop += 1) {
        const response = await get(current.toString());
        const location = response.headers.get('location');
        const target = location ? new URL(location, current) : null;
        await response.body?.cancel();

        if (response.status !== 308) {
          failures.push(
            `${route.from} returned ${response.status} at redirect hop ${hop}, not 308.`,
          );
          break;
        }
        if (!target || target.origin !== origin) {
          failures.push(`${route.from} left the approved site.`);
          break;
        }
        if (target.toString() === expected.toString()) {
          arrived = true;
          break;
        }
        current = target;
      }

      if (!arrived) {
        failures.push(`${route.from} did not end at ${route.to}.`);
      }
    } catch (error) {
      failures.push(`${route.from} failed: ${error.message}`);
    }
  }

  try {
    const home = await get(`${origin}/`);
    for (const header of REQUIRED_SECURITY_HEADERS) {
      if (!home.headers.get(header)) failures.push(`Missing ${header}.`);
    }
    const hsts = home.headers.get('strict-transport-security');
    if (hsts !== 'max-age=300') {
      failures.push(
        `HSTS is ${JSON.stringify(hsts)}, not the approved apex-only five-minute value.`,
      );
    }
    const robots = home.headers.get('x-robots-tag')?.toLowerCase() ?? '';
    if (
      expectNoindex &&
      (!robots.includes('noindex') || !robots.includes('nofollow'))
    ) {
      failures.push(
        'The generated validation address is not marked noindex, nofollow.',
      );
    }
    if (!expectNoindex && robots.includes('noindex')) {
      failures.push('The final public address is still marked noindex.');
    }
    const body = await home.text();
    if (!body.includes('Coding for Justice') || !body.includes('Small jobs')) {
      failures.push(
        'The home response is not the approved Coding for Justice site.',
      );
    }
  } catch (error) {
    failures.push(`Security-header check failed: ${error.message}`);
  }

  try {
    const admin = await get(`${origin}/admin`, 'manual');
    const location = admin.headers.get('location') ?? '';
    const target = location ? new URL(location, origin) : null;
    if (![303, 307, 308].includes(admin.status)) {
      failures.push(`/admin returned ${admin.status}, not a sign-in redirect.`);
    } else if (
      !target ||
      target.origin !== origin ||
      target.pathname !== '/signin-with-chatgpt'
    ) {
      failures.push('/admin did not redirect to ChatGPT sign-in.');
    }
    await admin.body?.cancel();
  } catch (error) {
    failures.push(`/admin protection check failed: ${error.message}`);
  }

  if (wwwOrigin) {
    try {
      const response = await get(
        `${wwwOrigin}/privacy?cutover_check=1`,
        'manual',
      );
      const location = response.headers.get('location');
      const target = location ? new URL(location, wwwOrigin) : null;
      if (response.status !== 308) {
        failures.push(`www returned ${response.status}, not permanent 308.`);
      } else if (
        !target ||
        target.origin !== origin ||
        target.pathname !== '/privacy' ||
        target.searchParams.get('cutover_check') !== '1'
      ) {
        failures.push(
          'www did not preserve the path while redirecting to the apex.',
        );
      }
      await response.body?.cancel();
    } catch (error) {
      failures.push(`www redirect check failed: ${error.message}`);
    }
  }

  if (failures.length) {
    console.error('Public-site check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Public-site check passed for ${DIRECT_ROUTES.length} pages and assets and ${LEGACY_REDIRECTS.length} old links.`,
  );
}

await main();
