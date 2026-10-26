import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { TickerBar } from '@/components/ticker-bar';
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
  title: 'OpenRegistro - the school register you actually own',
  description:
    'A self-hosted, open-source electronic register (gradebook) for K-12 schools: roles, class register, gradebook, and absence justifications. Free to self-host, free to get hosted.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${nunito.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <TickerBar />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
