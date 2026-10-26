import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@openregistro/ui';
import { BarChart3, Globe } from 'lucide-react';
import { listHostingRequests, type HostingRequestStatus } from '@openregistro/db';
import { isCpAdmin } from '@/lib/cp-admin';
import { getHostingDb } from '@/lib/hosting-db';
import { CpLoginForm } from '@/components/cp/cp-login-form';
import { EditHostingRequestDialog } from '@/components/cp/edit-hosting-request-dialog';
import { DeleteHostingRequestButton } from '@/components/cp/delete-hosting-request-button';
import { LicenseCell } from '@/components/cp/license-cell';
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

const SUBDOMAIN_STEPS = [
  {
    title: 'Create a new Vercel project for the school',
    detail:
      "vercel link --project <school-slug>-registro, Root Directory = apps/web. Every Vercel project gets a free *.vercel.app domain automatically - there's nothing to buy or configure for that part.",
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
    title: 'Deploy and run the setup wizard',
    detail:
      'vercel deploy --prod --yes, then open the free *.vercel.app URL and complete the first-run wizard as the school.',
  },
  {
    title: '(Optional) point a real subdomain at it',
    detail:
      'Only if the school wants something nicer than the free *.vercel.app URL: add a CNAME for school.openregistro.app (or their own domain) to the Vercel project in Domains settings. Not required - the free domain works on its own.',
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
  const requests = db ? await listHostingRequests(db) : [];

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
                    <LicenseCell id={req.id} licenseKey={req.licenseKey} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
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
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-primary-300 text-ink">
              <BarChart3 className="h-5 w-5" />
            </span>
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
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-primary-300 text-ink">
              <Globe className="h-5 w-5" />
            </span>
            <CardTitle className="mt-3">Setup steps</CardTitle>
            <CardDescription>
              There is no automated provisioning yet - this is the manual runbook. Every new
              instance gets a free *.vercel.app subdomain the moment it&apos;s deployed; a custom
              domain is optional, never required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-4">
              {SUBDOMAIN_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-primary-300 text-xs font-extrabold text-ink">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
