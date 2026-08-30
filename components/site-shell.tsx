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
        <Link href="/repairs">Jobs and examples</Link>
        <Link href="/outcomes">What changed</Link>
        <Link href="/covenant">Our rules</Link>
        <Link
          href="/start"
          className={cn(buttonVariants({ size: 'lg' }), 'header-action')}
        >
          How to get help
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
          Small jobs. Fairer rules, forms and services.
        </p>
      </div>
      <nav aria-label="Footer navigation" className="footer-links">
        <Link href="/covenant">Our rules</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/accessibility">Help with access</Link>
        <Link href="/appeal">How review will work</Link>
        <Link href="/archive">Old site</Link>
        <Link href="/feed.xml">RSS</Link>
      </nav>
      <p className="footer-boundary">
        Private means private. No comments. No likes. No pile-ons.
      </p>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a className="skip-link" href="#main-content">
        Skip to main
      </a>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
