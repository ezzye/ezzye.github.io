import type { Metadata } from 'next';

import { SiteShell } from '@/components/site-shell';

export const metadata: Metadata = {
  title: 'Old site',
  description:
    'The preserved 2021 Coding for Justice site and its historical context.',
};

const legacyItems = [
  {
    title: 'Coding for Equal Justice',
    description:
      'The founding 2021 statement about technology, inequality and access to justice.',
    path: 'docs/home/discrimination/2021/04/24/coding-for-equal-justice.html',
  },
  {
    title: 'Idea for the Police App',
    description: 'A historical product concept concerning stop and search.',
    path: 'docs/stop/and/search/app/2021/04/19/Idea-for-the-police-app.html',
  },
  {
    title: 'Stop and Search Video',
    description: 'A historical media page from the original site.',
    path: 'docs/youtube/stop/and/search/video/2021/04/19/youtube-stop-and-search-video.html',
  },
];

export default function ArchivePage() {
  return (
    <SiteShell>
      <header className="page-hero compact-hero">
        <p className="eyebrow">The old site</p>
        <h1>We did not wipe the past.</h1>
        <p>
          The pages from 2021 are still on GitHub. The new site works in a
          different way: one small job at a time, followed by a clear result.
        </p>
      </header>
      <section className="page-section archive-list" aria-label="Legacy pages">
        {legacyItems.map((item) => (
          <article key={item.path}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <a
              href={`https://github.com/ezzye/ezzye.github.io/blob/master/${item.path}`}
            >
              Read the old page on GitHub
            </a>
          </article>
        ))}
      </section>
      <section className="page-section archive-note">
        <h2>Old words are not new claims.</h2>
        <p>
          An old page may be out of date or wrong. If we use an old claim again,
          we must check it and show where it came from.
        </p>
      </section>
    </SiteShell>
  );
}
