import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bricolage_Grotesque, Nunito } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from '@openregistro/ui';
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
