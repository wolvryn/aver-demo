/**
 * src/app/layout.tsx
 *
 * What: The App Router root layout.
 * Does: Wraps every route with the html/body shell and global styles.
 * Use when: Framework entry — Next.js requires a default-exported root layout.
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Aver — agent output integrity, demonstrated',
  description:
    'The public demonstration of Aver: a live agent pipeline producing faulty outputs, with Aver catching them side by side.',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
