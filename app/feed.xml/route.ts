import { getLatestOutcomes, getPublicRepairs } from '@/db/queries';

export const dynamic = 'force-dynamic';

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const [repairs, outcomes] = await Promise.all([
    getPublicRepairs(),
    getLatestOutcomes(20),
  ]);
  const items = [
    ...repairs.map((repair) => ({
      title: `Repair: ${repair.title}`,
      description: repair.summary,
      link: `${origin}/repairs/${repair.slug}`,
      date: repair.updatedAt,
      id: repair.id,
    })),
    ...outcomes.map((outcome) => ({
      title: `Outcome: ${outcome.title}`,
      description: `${outcome.observedEffect} Limit: ${outcome.whatDidNotChange}`,
      link: `${origin}/repairs/${outcome.repairSlug ?? 'public-consultation'}`,
      date: outcome.publishedAt,
      id: outcome.id,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Coding for Justice</title>
    <link>${escapeXml(origin)}</link>
    <description>Fairness repairs and their evidenced outcomes.</description>
    <language>en-gb</language>
    ${items
      .map(
        (item) => `<item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`,
      )
      .join('\n    ')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
