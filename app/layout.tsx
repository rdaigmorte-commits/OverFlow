import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { Fredoka, Plus_Jakarta_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['700'], variable: '--font-fredoka' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

const title = 'OverFlow — Find your squad. Play IRL.';
const description =
  'Same games, same city, same vibe. OverFlow connects gamers in Utrecht who actually want to team up — no feed, no algorithm, just real people.';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.overflowsquad.gg'),
  title: {
    default: title,
    template: '%s — OverFlow',
  },
  description,
  openGraph: {
    title,
    description,
    url: 'https://www.overflowsquad.gg',
    siteName: 'OverFlow',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${jakarta.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
