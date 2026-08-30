import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
  metadataBase: new URL('https://codingforjustice.org.uk'),
  title: {
    default: 'Coding for Justice — Fairness repair workshop',
    template: '%s — Coding for Justice',
  },
  description:
    'A public workshop for turning repeatable unfair processes into practical, evidenced repairs.',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Coding for Justice',
    title: 'Coding for Justice — Turn concern into repair',
    description:
      'A public workshop for turning repeatable unfair processes into practical, evidenced repairs.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Coding for Justice — Turn concern into repair',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coding for Justice — Turn concern into repair',
    description:
      'A public workshop for turning repeatable unfair processes into practical, evidenced repairs.',
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
