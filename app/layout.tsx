import './globals.css';
import React from 'react';
import { Fredoka, Plus_Jakarta_Sans } from 'next/font/google';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['700'], variable: '--font-fredoka' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata = { title: 'OverFlow', description: 'Local gaming matchmaking' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
