import { Heart } from 'lucide-react';
import { Button, IconBadge } from '@openregistro/ui';
import { PAYPAL_DONATE_URL } from '@/lib/constants';

export function DonateSection() {
  return (
    <section id="donate" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-primary-100 px-8 py-12 shadow-hard sm:px-14">
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <IconBadge size="xl">
                <Heart className="h-6 w-6" />
              </IconBadge>
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Help keep OpenRegistro free
                </h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Donations cover hosting costs and the fees to publish the official Android and iOS
                  apps on the Play Store and App Store. Every bit helps.
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <a href={PAYPAL_DONATE_URL} target="_blank" rel="noreferrer">
                <Heart className="h-4 w-4" />
                Donate with PayPal
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
