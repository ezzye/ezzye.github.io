import type { Metadata } from 'next';

import { SiteShell } from '@/components/site-shell';

export const metadata: Metadata = {
  title: 'Legacy archive',
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
        <p className="eyebrow">Preserved, not quietly rewritten</p>
        <h1>Legacy archive</h1>
        <p>
          The original GitHub Pages site remains in source control as a rollback
          point and historical record. Phase one changes the method: from static
          advocacy pages to bounded repairs and public outcome evidence.
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
              View preserved source on GitHub
            </a>
          </article>
        ))}
      </section>
      <section className="page-section archive-note">
        <h2>Historical material is not a current allegation.</h2>
        <p>
          Archive links preserve provenance. They do not certify that every old
          statement is current, complete or suitable for a new repair. A current
          claim must be reframed, sourced and reviewed under the covenant.
        </p>
      </section>
    </SiteShell>
  );
}
