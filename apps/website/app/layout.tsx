import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeScript } from '@/components/theme-script';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OpenRegistro - open source school register',
  description:
    'A self-hosted, open-source electronic register (gradebook) for K-12 schools: roles, class register, gradebook, and absence justifications.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
