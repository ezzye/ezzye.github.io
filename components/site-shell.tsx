import Link from 'next/link';
import type { ReactNode } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Coding for Justice home">
        <span aria-hidden="true" className="wordmark-mark">
          CFJ
        </span>
        <span>Coding for Justice</span>
      </Link>
      <nav aria-label="Primary navigation" className="header-nav">
        <Link href="/repairs">Repairs</Link>
        <Link href="/outcomes">Outcomes</Link>
        <Link href="/covenant">What we stand for</Link>
        <Link
          href="/start"
          className={cn(buttonVariants({ size: 'lg' }), 'header-action')}
        >
          Bring a barrier
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="footer-title">Coding for Justice</p>
        <p className="footer-copy">
          One unfair process. One practical repair. Evidence in public.
        </p>
      </div>
      <nav aria-label="Footer navigation" className="footer-links">
        <Link href="/covenant">Covenant</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/accessibility">Accessibility</Link>
        <Link href="/appeal">Corrections and appeals</Link>
        <Link href="/archive">Legacy archive</Link>
        <Link href="/feed.xml">RSS</Link>
      </nav>
      <p className="footer-boundary">
        No public comments. No engagement ranking. No private material published
        without review.
      </p>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a className="skip-link" href="#main-content">
        Skip to the work
      </a>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
