import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bricolage_Grotesque, Nunito } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { TickerBar } from '@/components/ticker-bar';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
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
