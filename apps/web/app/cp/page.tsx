import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@openregistro/ui';
import { BarChart3, GitCommit, Globe, Mail } from 'lucide-react';
import {
  listHostingRequests,
  getPlatformSettings,
  type HostingRequestStatus,
  type ProvisioningStatus,
} from '@openregistro/db';
import { isCpAdmin } from '@/lib/cp-admin';
import { getHostingDb } from '@/lib/hosting-db';
import { getEnv } from '@/lib/env';
import {
  getCommitsBehindMain,
  getLatestMainCommit,
  getRunningVersion,
  REPO_URL,
} from '@/lib/deployment-status';
import { CpLoginForm } from '@/components/cp/cp-login-form';
import { EditHostingRequestDialog } from '@/components/cp/edit-hosting-request-dialog';
import { DeleteHostingRequestButton } from '@/components/cp/delete-hosting-request-button';
import { LicenseCell } from '@/components/cp/license-cell';
import { RedeployButton } from '@/components/cp/redeploy-button';
import { ProvisionRequestButton } from '@/components/cp/provision-request-button';
import { NotifyReadyDialog } from '@/components/cp/notify-ready-dialog';
import { NotificationEmailsForm } from '@/components/cp/notification-emails-form';
import { setHostingRequestStatus, logoutCp } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<
  HostingRequestStatus,
  'secondary' | 'warning' | 'success' | 'destructive'
> = {
  pending: 'secondary',
  contacted: 'warning',
  activated: 'success',
  declined: 'destructive',
};

const STATUS_LABEL: Record<HostingRequestStatus, string> = {
  pending: 'new',
  contacted: 'contacted',
  activated: 'set up',
  declined: 'declined',
};

const STATUSES: HostingRequestStatus[] = ['pending', 'contacted', 'activated', 'declined'];

const PROVISIONING_BADGE: Record<
  ProvisioningStatus,
  'secondary' | 'warning' | 'success' | 'destructive'
> = {
  not_started: 'secondary',
  provisioning: 'warning',
  ready: 'success',
  failed: 'destructive',
};

const PROVISIONING_LABEL: Record<ProvisioningStatus, string> = {
  not_started: 'manual',
  provisioning: 'provisioning...',
  ready: 'live',
  failed: 'failed',
};

function describeVersion(
  commitSha: string | null,
  latestSha: string | null,
  commitsBehind: number | null,
): { variant: 'success' | 'warning' | 'outline'; label: string } {
  if (!commitSha) return { variant: 'outline', label: 'Version unknown' };
  if (commitSha === latestSha) return { variant: 'success', label: 'Up to date' };
  if (commitsBehind) {
    return {
      variant: 'warning',
      label: `${commitsBehind} commit${commitsBehind === 1 ? '' : 's'} behind`,
    };
  }
  return { variant: 'warning', label: 'Update available' };
}

const SUBDOMAIN_STEPS = [
  {
    title: 'Create a new Vercel project for the school',
    detail:
      'vercel link --project <school-slug>-registro, Root Directory = apps/web, same Git repo/branch as the other deployments.',
  },
  {
    title: 'Provision a database',
    detail:
      'vercel integration add neon (or reuse an existing Neon project) to get a free DATABASE_URL, then run pnpm --filter @openregistro/db db:migrate against it.',
  },
  {
    title: 'Set the required environment variables',
    detail: 'STORAGE_DRIVER=postgres, DATABASE_URL, AUTH_SECRET (openssl rand -base64 32).',
  },
  {
    title: 'Deploy and attach the assigned subdomain',
    detail:
      "vercel deploy --prod --yes, then vercel domains add <subdomain>.openregistro.another-horizon.eu <project> using the subdomain already shown in the table above - it was generated automatically the moment this request was marked 'set up'. Once it's live, use the 'Notify' button in the Actions column to tell the school.",
  },
];

export default async function CpPage() {
  if (!(await isCpAdmin())) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4">
        <div className="w-full max-w-sm">
          <Card className="shadow-hard">
            <CardHeader>
              <CardTitle className="font-display text-xl">Control panel</CardTitle>
              <CardDescription>Operator access only.</CardDescription>
            </CardHeader>
            <CardContent>
              <CpLoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const db = getHostingDb();
  const running = getRunningVersion();
  const [requests, platformSettings, latest, commitsBehind] = await Promise.all([
    db ? listHostingRequests(db) : Promise.resolve([]),
    db ? getPlatformSettings(db) : Promise.resolve({ notificationEmails: [] }),
    getLatestMainCommit(),
    running.commitSha ? getCommitsBehindMain(running.commitSha) : Promise.resolve(null),
  ]);
  const version = describeVersion(running.commitSha, latest?.sha ?? null, commitsBehind);
  const { CP_DEMO_DEPLOY_HOOK_URL, VERCEL_PROVISIONING_TOKEN } = getEnv();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Control panel</h1>
          <p className="text-sm text-muted-foreground">
            Manage free hosting requests, generate reference license keys, and set up new hosted
            instances.
          </p>
        </div>
        <form action={logoutCp}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Deployment</h2>
        <Card>
          <CardHeader>
            <IconBadge>
              <GitCommit className="h-5 w-5" />
            </IconBadge>
            <CardTitle className="mt-3">This demo&apos;s version</CardTitle>
            <CardDescription>
              {running.commitShaShort ? (
                <>
                  Running{' '}
                  <a
                    href={`${REPO_URL}/commit/${running.commitSha}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-foreground underline"
                  >
                    {running.commitShaShort}
                  </a>
                  .
                </>
              ) : (
                'Running commit is unknown on this deployment (only Vercel sets this automatically).'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {latest ? (
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={version.variant}>{version.label}</Badge>
                <p className="text-sm text-muted-foreground">
                  Latest on <code>main</code>:{' '}
                  <a
                    href={latest.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-foreground underline"
                  >
                    {latest.shaShort}
                  </a>{' '}
                  - {latest.message}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Could not reach GitHub to check the latest commit on <code>main</code> right now.
              </p>
            )}

            {CP_DEMO_DEPLOY_HOOK_URL ? (
              <RedeployButton />
            ) : (
              <p className="text-sm text-muted-foreground">
                Set <code>CP_DEMO_DEPLOY_HOOK_URL</code> (a Vercel Deploy Hook for this project) to
                enable one-click redeploys here. Until then, update by running{' '}
                <code>vercel deploy --prod</code> from <code>apps/web</code>, or for a self-hosted
                install,{' '}
                <code>git pull &amp;&amp; docker compose pull &amp;&amp; docker compose up -d</code>
                .
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Hosting requests</h2>
        {requests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No hosting requests yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Provisioning</TableHead>
                <TableHead>License</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.schoolName}</TableCell>
                  <TableCell>
                    <div>{req.contactName}</div>
                    <div className="text-xs text-muted-foreground">{req.contactEmail}</div>
                  </TableCell>
                  <TableCell>{req.approxStudents ?? '-'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {req.createdAt.slice(0, 10)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_BADGE[req.status]}>{STATUS_LABEL[req.status]}</Badge>
                      <form action={setHostingRequestStatus} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={req.id} />
                        <select
                          name="status"
                          defaultValue={req.status}
                          className="h-8 rounded-lg border-2 border-border bg-surface px-2 text-xs"
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABEL[status]}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" size="sm" variant="outline">
                          Update
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                  <TableCell>
                    {req.subdomain ? (
                      <a
                        href={`https://${req.subdomain}.openregistro.another-horizon.eu`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-foreground underline"
                      >
                        {req.subdomain}
                      </a>
                    ) : req.requestedSubdomain ? (
                      <span
                        className="font-mono text-xs text-muted-foreground"
                        title="Requested - not yet assigned"
                      >
                        {req.requestedSubdomain}?
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1.5">
                      <Badge variant={PROVISIONING_BADGE[req.provisioningStatus]}>
                        {PROVISIONING_LABEL[req.provisioningStatus]}
                      </Badge>
                      {req.provisioningStatus === 'failed' && req.provisioningError ? (
                        <p className="max-w-48 text-xs text-destructive">{req.provisioningError}</p>
                      ) : null}
                      {VERCEL_PROVISIONING_TOKEN &&
                      req.subdomain &&
                      req.provisioningStatus !== 'ready' &&
                      req.provisioningStatus !== 'provisioning' ? (
                        <ProvisionRequestButton id={req.id} />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <LicenseCell id={req.id} licenseKey={req.licenseKey} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {req.subdomain ? (
                        <NotifyReadyDialog
                          id={req.id}
                          schoolName={req.schoolName}
                          subdomain={req.subdomain}
                        />
                      ) : null}
                      <EditHostingRequestDialog request={req} />
                      <DeleteHostingRequestButton id={req.id} schoolName={req.schoolName} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Site visits</h2>
        <Card>
          <CardHeader>
            <IconBadge>
              <BarChart3 className="h-5 w-5" />
            </IconBadge>
            <CardTitle className="mt-3">Vercel Web Analytics</CardTitle>
            <CardDescription>
              Both the marketing site and this app report real, privacy-friendly page views to
              Vercel. There is no API to embed the numbers here without a paid plan, so view them
              directly on the Vercel dashboard:
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a
                href="https://vercel.com/leo-gallis-projects/openregistro/analytics"
                target="_blank"
                rel="noreferrer"
              >
                Marketing site analytics
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://vercel.com/leo-gallis-projects/openregistro-demo/analytics"
                target="_blank"
                rel="noreferrer"
              >
                Live demo analytics
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Hosting a new school for free</h2>
        <Card>
          <CardHeader>
            <IconBadge>
              <Globe className="h-5 w-5" />
            </IconBadge>
            <CardTitle className="mt-3">Setup steps</CardTitle>
            <CardDescription>
              {VERCEL_PROVISIONING_TOKEN ? (
                <>
                  Marking a request &quot;set up&quot; assigns it a
                  &lt;subdomain&gt;.openregistro.another-horizon.eu address. From there it&apos;s
                  two deliberate clicks in the Provisioning and Actions columns above: &quot;Create
                  project&quot; provisions a dedicated Vercel project, a free Neon database via
                  Vercel&apos;s own marketplace integration, and an initial deploy from{' '}
                  <code>main</code> - then &quot;Notify&quot; sends the school a confirmation email
                  (with an editable note) once you&apos;ve confirmed it&apos;s actually live. Only
                  falls back to the manual runbook below if provisioning fails.
                </>
              ) : (
                <>
                  Marking a request &quot;set up&quot; automatically assigns it a
                  &lt;subdomain&gt;.openregistro.another-horizon.eu address. Set{' '}
                  <code>VERCEL_PROVISIONING_TOKEN</code> to enable the one-click &quot;Create
                  project&quot; button; until then, creating the actual Vercel project and database
                  is the manual runbook below. Once it&apos;s live (automated or manual), use
                  &quot;Notify&quot; in the Actions column to email the school a confirmation, with
                  an editable note.
                </>
              )}
            </CardDescription>
          </CardHeader>
          {VERCEL_PROVISIONING_TOKEN ? null : (
            <CardContent>
              <ol className="flex flex-col gap-4">
                {SUBDOMAIN_STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <IconBadge size="xs" shape="circle" className="text-xs font-extrabold">
                      {index + 1}
                    </IconBadge>
                    <div>
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">New request notifications</h2>
        <Card>
          <CardHeader>
            <IconBadge>
              <Mail className="h-5 w-5" />
            </IconBadge>
            <CardTitle className="mt-3">Who gets pinged</CardTitle>
            <CardDescription>
              Every address below gets a branded email the moment a school submits the free hosting
              form - one per line or comma-separated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationEmailsForm initialEmails={platformSettings.notificationEmails} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
