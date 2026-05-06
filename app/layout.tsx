import './globals.css';
import React from 'react';

export const metadata = { title: 'OverFlow', description: 'Local gaming matchmaking in Utrecht' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
