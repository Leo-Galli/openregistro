import type { Metadata } from 'next';
import { Server, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, IconBadge } from '@openregistro/ui';
import { HostRequestForm } from '@/components/host-request-form';

export const metadata: Metadata = {
  title: 'Get a free hosted instance - OpenRegistro',
  description: 'Get a free, managed, hosted OpenRegistro instance for your school.',
};

const POINTS = [
  {
    icon: Server,
    title: 'We run it for you',
    description: 'A dedicated instance with its own database - no server to maintain yourself.',
  },
  {
    icon: ShieldCheck,
    title: 'Your data, isolated',
    description: 'Every hosted school gets its own instance and its own database, never shared.',
  },
  {
    icon: Zap,
    title: 'Completely free',
    description:
      "There's no fee and no approval step - submit your details and your instance gets set up.",
  },
];

export default function HostPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Get a free hosted instance
        </h1>
        <p className="mt-4 text-muted-foreground">
          OpenRegistro is free and open source to self-host. If your school would rather not run its
          own server, we also offer free managed hosting - tell us about your school below.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          {POINTS.map((point) => (
            <Card key={point.title}>
              <CardHeader>
                <IconBadge>
                  <point.icon className="h-5 w-5" />
                </IconBadge>
                <CardTitle className="mt-3">{point.title}</CardTitle>
              </CardHeader>
              <CardContent className="-mt-2 text-sm text-muted-foreground">
                {point.description}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tell us about your school</CardTitle>
          </CardHeader>
          <CardContent>
            <HostRequestForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
