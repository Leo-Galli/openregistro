import {
  Badge,
  Button,
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
import { Trash2 } from 'lucide-react';
import { auth } from '@/auth';
import { can, requirePermission } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { CreateEventDialog } from '@/components/calendar/create-event-dialog';
import { deleteCalendarEvent } from './actions';

export const dynamic = 'force-dynamic';

const TYPE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  test: 'default',
  event: 'secondary',
  holiday: 'outline',
};

export default async function CalendarPage() {
  const session = await auth();
  requirePermission(session!, 'calendar:read');

  const canWrite = can(session!, 'calendar:write');
  const storage = await getStorage();
  const events = (await storage.calendarEvents.findMany()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Calendar</h1>
        {canWrite ? <CreateEventDialog /> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming and past events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  {canWrite ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>
                      <Badge variant={TYPE_VARIANT[event.type] ?? 'default'}>{event.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{event.title}</p>
                      {event.description ? (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      ) : null}
                    </TableCell>
                    {canWrite ? (
                      <TableCell>
                        <form action={deleteCalendarEvent}>
                          <input type="hidden" name="eventId" value={event.id} />
                          <Button type="submit" size="sm" variant="ghost" aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </TableCell>
                    ) : null}
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
