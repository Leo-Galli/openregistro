import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@openregistro/ui';
import { listHostingRequests, type HostingRequestStatus } from '@openregistro/db';
import { requireHostingAdmin } from '@/lib/hosting-admin';
import { getHostingDb } from '@/lib/hosting-db';
import { EditHostingRequestDialog } from '@/components/internal/edit-hosting-request-dialog';
import { DeleteHostingRequestButton } from '@/components/internal/delete-hosting-request-button';
import { setHostingRequestStatus, logoutInternal } from './actions';

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

export default async function HostingRequestsPage() {
  await requireHostingAdmin();
  const db = getHostingDb();
  const requests = db ? await listHostingRequests(db) : [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Hosting requests</h1>
          <p className="text-sm text-muted-foreground">
            Schools that signed up for free managed hosting. Nothing here blocks or approves
            anything - this is just your own tracking: edit a request, remove one, or note where you
            are with setting each school up.
          </p>
        </div>
        <form action={logoutInternal}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>

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
              <TableHead>Message</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Status</TableHead>
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
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {req.message ?? '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {req.createdAt.slice(0, 10)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[req.status]}>{STATUS_LABEL[req.status]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={setHostingRequestStatus} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={req.id} />
                      <select
                        name="status"
                        defaultValue={req.status}
                        className="h-8 rounded-lg border border-border bg-surface px-2 text-xs"
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
                    <EditHostingRequestDialog request={req} />
                    <DeleteHostingRequestButton id={req.id} schoolName={req.schoolName} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
