import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@openregistro/ui';
import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const ACTION_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  create: 'default',
  update: 'secondary',
  delete: 'destructive',
};

export default async function AuditLogPage() {
  const session = await auth();
  requirePermission(session!, 'audit:read');

  const storage = await getStorage();
  const entries = (await storage.auditLog.findMany()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  const actorIds = [...new Set(entries.map((e) => e.actorId))];
  const actors = (await Promise.all(actorIds.map((id) => storage.users.findById(id)))).filter(
    (user): user is NonNullable<typeof user> => user !== null,
  );
  const actorsById = new Map(actors.map((user) => [user.id, user]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          A record of sensitive changes: accounts, grades, term evaluations, and absence
          justification reviews.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {entry.createdAt.slice(0, 19).replace('T', ' ')}
                    </TableCell>
                    <TableCell>{actorsById.get(entry.actorId)?.fullName ?? 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[entry.action] ?? 'default'}>
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{entry.entityKind}</TableCell>
                    <TableCell>
                      <details>
                        <summary className="cursor-pointer text-sm text-primary">View</summary>
                        <pre className="mt-2 max-w-md overflow-x-auto rounded-md bg-muted p-2 text-xs">
                          {JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}
                        </pre>
                      </details>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
