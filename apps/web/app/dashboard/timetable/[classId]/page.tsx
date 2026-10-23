import { notFound } from 'next/navigation';
import { classIdSchema } from '@openregistro/core';
import {
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
import { requirePermission, schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { AddSlotDialog, type AssignmentOption } from '@/components/timetable/add-slot-dialog';
import { removeTimetableSlot } from './actions';

export const dynamic = 'force-dynamic';

const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
];
const HOURS = Array.from({ length: 8 }, (_, index) => index + 1);

export default async function TimetableClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const session = await auth();
  requirePermission(session!, 'calendar:write');

  const parsedClassId = classIdSchema.safeParse(classId);
  if (!parsedClassId.success) notFound();

  const storage = await getStorage();
  const schoolId = schoolIdOf(session!);
  const klass = await storage.classes.findById(parsedClassId.data);
  if (!klass || klass.schoolId !== schoolId) notFound();

  const [slots, teacherAssignments] = await Promise.all([
    storage.timetableSlots.findMany({ classId: klass.id }),
    storage.teacherAssignments.findMany({ classId: klass.id }),
  ]);

  const teacherIds = [...new Set(teacherAssignments.map((a) => a.teacherId))];
  const subjectIds = [...new Set(teacherAssignments.map((a) => a.subjectId))];
  const [teachers, subjects] = await Promise.all([
    Promise.all(teacherIds.map((id) => storage.users.findById(id))),
    Promise.all(subjectIds.map((id) => storage.subjects.findById(id))),
  ]);
  const teachersById = new Map(
    teachers.filter((t): t is NonNullable<typeof t> => t !== null).map((t) => [t.id, t]),
  );
  const subjectsById = new Map(
    subjects.filter((s): s is NonNullable<typeof s> => s !== null).map((s) => [s.id, s]),
  );

  const assignmentOptions: AssignmentOption[] = teacherAssignments
    .map((a) => ({
      subjectId: a.subjectId,
      subjectName: subjectsById.get(a.subjectId)?.name ?? 'Unknown',
      teacherId: a.teacherId,
      teacherName: teachersById.get(a.teacherId)?.fullName ?? 'Unknown',
    }))
    .filter((a) => a.subjectName !== 'Unknown' && a.teacherName !== 'Unknown');

  const slotByCell = new Map(slots.map((slot) => [`${slot.weekday}:${slot.hourSlot}`, slot]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold">{klass.name} timetable</h1>

      <Card>
        <CardHeader>
          <CardTitle>Weekly schedule</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hour</TableHead>
                {WEEKDAYS.map((day) => (
                  <TableHead key={day.value}>{day.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {HOURS.map((hour) => (
                <TableRow key={hour}>
                  <TableCell className="font-medium">{hour}</TableCell>
                  {WEEKDAYS.map((day) => {
                    const slot = slotByCell.get(`${day.value}:${hour}`);
                    return (
                      <TableCell key={day.value}>
                        {slot ? (
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">
                                {subjectsById.get(slot.subjectId)?.name ?? 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {teachersById.get(slot.teacherId)?.fullName ?? 'Unknown'}
                              </p>
                            </div>
                            <form action={removeTimetableSlot}>
                              <input type="hidden" name="slotId" value={slot.id} />
                              <input type="hidden" name="classId" value={klass.id} />
                              <Button type="submit" size="sm" variant="ghost" aria-label="Remove">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        ) : (
                          <AddSlotDialog
                            classId={klass.id}
                            weekday={day.value}
                            hourSlot={hour}
                            assignments={assignmentOptions}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
