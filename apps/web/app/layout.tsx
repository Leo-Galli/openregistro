import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Space_Grotesk } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from '@openregistro/ui';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OpenRegistro',
  description: 'Self-hosted school electronic register.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        {children}
        <Toaster />
        {/*
         * Opt-in only, off by default: self-hosted schools never get
         * third-party analytics bundled in without asking (see the "no
         * telemetry" promise in the marketing site's FAQ) - only this
         * project's own managed deployment sets NEXT_PUBLIC_ENABLE_ANALYTICS.
         */}
        {process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' ? <Analytics /> : null}
      </body>
    </html>
  );
}
