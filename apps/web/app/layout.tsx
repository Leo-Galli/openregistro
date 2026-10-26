import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from '@openregistro/ui';
import './globals.css';

/*
 * Self-hosted rather than next/font/google: a live fetch to Google Fonts at
 * build time was an intermittent build failure (flaky network/response
 * parsing, independent of the earlier Turbopack multi-subset bug already
 * worked around via --webpack) - self-hosting removes that dependency
 * entirely. Files are the exact latin-subset woff2s Google Fonts itself
 * serves, downloaded once; no visual change.
 */
const bricolage = localFont({
  src: './fonts/bricolage-grotesque-variable.woff2',
  weight: '200 800',
  variable: '--font-bricolage',
  display: 'swap',
});

const nunito = localFont({
  src: [
    { path: './fonts/nunito-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/nunito-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/nunito-800.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OpenRegistro',
  description: 'Self-hosted school electronic register.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${nunito.variable} ${GeistMono.variable}`}>
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
