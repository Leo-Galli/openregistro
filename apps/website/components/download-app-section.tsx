import { Download, Smartphone } from 'lucide-react';
import { Button, IconBadge } from '@openregistro/ui';
import { ANDROID_APK_URL, ANDROID_RELEASES_URL, PAYPAL_DONATE_URL } from '@/lib/constants';

export function DownloadAppSection() {
  return (
    <section id="download" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Official Android app
          </h2>
          <p className="mt-3 text-muted-foreground">
            Install the APK, pick your school (hosted by us or self-hosted), and sign in. The app
            detects your role - teacher, student, guardian, admin - from your account after login.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border-2 border-border bg-surface p-8 shadow-hard">
            <div className="flex items-start gap-4">
              <IconBadge size="xl">
                <Smartphone className="h-6 w-6" />
              </IconBadge>
              <div>
                <h3 className="font-display text-xl font-semibold">OpenRegistro.apk</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sideloadable build from the latest CI run. On Android, allow installs from this
                  browser if prompted. Play Store and App Store listings are funded by donations.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={ANDROID_APK_URL} download>
                  <Download className="h-4 w-4" />
                  Download APK
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={ANDROID_RELEASES_URL} target="_blank" rel="noreferrer">
                  Release notes
                </a>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <a href={PAYPAL_DONATE_URL} target="_blank" rel="noreferrer">
                  Support store fees
                </a>
              </Button>
            </div>
          </div>

          <ol className="flex flex-col gap-3 rounded-2xl border-2 border-border bg-muted/40 p-6 shadow-hard-sm">
            <li className="text-sm font-medium">
              <span className="font-extrabold text-blue-600">1.</span> Install the APK
            </li>
            <li className="text-sm font-medium">
              <span className="font-extrabold text-blue-600">2.</span> Search and select your school
            </li>
            <li className="text-sm font-medium">
              <span className="font-extrabold text-blue-600">3.</span> Sign in with your school
              account
            </li>
            <li className="text-sm font-medium">
              <span className="font-extrabold text-blue-600">4.</span> The app shows your name,
              school, and role automatically
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
