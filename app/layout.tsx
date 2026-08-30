import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { PUBLIC_ORIGIN } from '@/lib/site-origin';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_ORIGIN),
  alternates: {
    canonical: PUBLIC_ORIGIN,
  },
  title: {
    default: 'Coding for Justice — Small jobs that fix unfair things',
    template: '%s — Coding for Justice',
  },
  description:
    'Pick a small job, tell us what keeps going wrong, or see what changed.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
  },
  openGraph: {
    url: PUBLIC_ORIGIN,
    type: 'website',
    locale: 'en_GB',
    siteName: 'Coding for Justice',
    title: 'Coding for Justice — Small jobs. Fairer rules.',
    description:
      'Pick a small job, tell us what keeps going wrong, or see what changed.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Coding for Justice — Small jobs. Fairer rules.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coding for Justice — Small jobs. Fairer rules.',
    description:
      'Pick a small job, tell us what keeps going wrong, or see what changed.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
