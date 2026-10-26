import type { UserId } from '@openregistro/core';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@openregistro/ui';
import { Trash2 } from 'lucide-react';
import { auth } from '@/auth';
import { can, requirePermission, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { CreateSlotDialog } from '@/components/meetings/create-slot-dialog';
import { BookSlotDialog } from '@/components/meetings/book-slot-dialog';
import { deleteMeetingSlot } from './actions';

export const dynamic = 'force-dynamic';

function formatRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const date = start.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const startTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${startTime}-${endTime}`;
}

async function ManageMeetings({ teacherId }: { teacherId: UserId }) {
  const storage = await getStorage();
  const slots = (await storage.meetingSlots.findMany({ teacherId })).sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );

  const bookingsBySlot = new Map(
    await Promise.all(
      slots.map(
        async (slot) =>
          [slot.id, await storage.meetingBookings.findMany({ meetingSlotId: slot.id })] as const,
      ),
    ),
  );
  const allBookings = [...bookingsBySlot.values()].flat();
  const studentIds = [...new Set(allBookings.map((b) => b.studentId))];
  const students = (await Promise.all(studentIds.map((id) => storage.users.findById(id)))).filter(
    (s): s is NonNullable<typeof s> => s !== null,
  );
  const studentsById = new Map(students.map((s) => [s.id, s]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your meeting slots</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No meeting slots offered yet.</p>
        ) : (
          slots.map((slot) => {
            const bookings = bookingsBySlot.get(slot.id) ?? [];
            return (
              <div key={slot.id} className="rounded-md border-2 border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{formatRange(slot.startsAt, slot.endsAt)}</p>
                    <p className="text-sm text-muted-foreground">
                      {slot.location ?? 'No location set'} · {bookings.length}/{slot.capacity}{' '}
                      booked
                    </p>
                  </div>
                  {bookings.length === 0 ? (
                    <form action={deleteMeetingSlot}>
                      <input type="hidden" name="slotId" value={slot.id} />
                      <Button type="submit" size="sm" variant="ghost" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  ) : null}
                </div>
                {bookings.length > 0 ? (
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {bookings.map((booking) => (
                      <li key={booking.id}>
                        {studentsById.get(booking.studentId)?.fullName ?? 'Unknown student'}
                        {booking.notes ? ` - ${booking.notes}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

async function BookMeetings({ guardianId }: { guardianId: UserId }) {
  const storage = await getStorage();
  const guardianships = await storage.guardianships.findMany({ guardianId });
  const students = (
    await Promise.all(guardianships.map((g) => storage.users.findById(g.studentId)))
  )
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .map((s) => ({ id: s.id, fullName: s.fullName }));

  const allSlots = (await storage.meetingSlots.findMany()).sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
  const slotsWithBookings = await Promise.all(
    allSlots.map(async (slot) => ({
      slot,
      bookings: await storage.meetingBookings.findMany({ meetingSlotId: slot.id }),
    })),
  );
  const availableSlots = slotsWithBookings.filter(
    ({ slot, bookings }) => bookings.length < slot.capacity,
  );

  const teacherIds = [...new Set(availableSlots.map(({ slot }) => slot.teacherId))];
  const teachers = (await Promise.all(teacherIds.map((id) => storage.users.findById(id)))).filter(
    (t): t is NonNullable<typeof t> => t !== null,
  );
  const teachersById = new Map(teachers.map((t) => [t.id, t]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available meeting slots</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">No linked students yet.</p>
        ) : availableSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No meeting slots available right now.</p>
        ) : (
          availableSlots.map(({ slot, bookings }) => (
            <div
              key={slot.id}
              className="flex items-center justify-between rounded-md border-2 border-border p-4"
            >
              <div>
                <p className="font-medium">
                  {teachersById.get(slot.teacherId)?.fullName ?? 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatRange(slot.startsAt, slot.endsAt)} · {slot.location ?? 'No location set'} ·{' '}
                  {slot.capacity - bookings.length} spot(s) left
                </p>
              </div>
              <BookSlotDialog meetingSlotId={slot.id} students={students} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default async function MeetingsPage() {
  const session = await auth();
  requirePermission(session!, 'calendar:read');

  const canManage = can(session!, 'meetings:manage');
  const canBook = session!.user.role === 'guardian' && can(session!, 'meetings:book');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Parent-teacher meetings</h1>
        {canManage ? <CreateSlotDialog /> : null}
      </div>
      {canManage ? <ManageMeetings teacherId={userIdOf(session!)} /> : null}
      {canBook ? <BookMeetings guardianId={userIdOf(session!)} /> : null}
      {!canManage && !canBook ? (
        <p className="text-sm text-muted-foreground">Nothing to show here for your role yet.</p>
      ) : null}
    </div>
  );
}
