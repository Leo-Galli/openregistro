'use client';

import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@openregistro/ui';
import { saveAttendance } from '@/app/dashboard/register/[classId]/actions';

interface StudentOption {
  id: string;
  fullName: string;
}

interface ExistingRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'early_leave';
  minutesLate: number | null;
}

interface AttendanceFormValues {
  entries: Record<string, { status: ExistingRecord['status']; minutesLate: string }>;
}

const STATUS_LABELS: Record<ExistingRecord['status'], string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  early_leave: 'Early leave',
};

export function AttendanceGrid({
  classId,
  date,
  students,
  existingRecords,
}: {
  classId: string;
  date: string;
  students: StudentOption[];
  existingRecords: ExistingRecord[];
}) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const existingByStudent = new Map(existingRecords.map((record) => [record.studentId, record]));

  const { control, handleSubmit, watch } = useForm<AttendanceFormValues>({
    defaultValues: {
      entries: Object.fromEntries(
        students.map((student) => {
          const existing = existingByStudent.get(student.id);
          return [
            student.id,
            {
              status: existing?.status ?? 'present',
              minutesLate: existing?.minutesLate != null ? String(existing.minutesLate) : '5',
            },
          ];
        }),
      ),
    },
  });

  function onSubmit(values: AttendanceFormValues) {
    startTransition(async () => {
      const outcome = await saveAttendance({
        classId,
        date,
        entries: students.map((student) => ({
          studentId: student.id,
          status: values.entries[student.id]?.status ?? 'present',
          minutesLate:
            values.entries[student.id]?.status === 'late'
              ? Number(values.entries[student.id]?.minutesLate ?? 0)
              : null,
        })),
      });
      setResult(
        outcome.ok
          ? { ok: true, message: 'Attendance saved.' }
          : { ok: false, message: outcome.formError ?? 'Could not save attendance.' },
      );
    });
  }

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Minutes late</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const status = watch(`entries.${student.id}.status`);
            return (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.fullName}</TableCell>
                <TableCell>
                  <Controller
                    control={control}
                    name={`entries.${student.id}.status`}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </TableCell>
                <TableCell>
                  {status === 'late' ? (
                    <Controller
                      control={control}
                      name={`entries.${student.id}.minutesLate`}
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={1}
                          max={600}
                          className="w-24"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {result ? (
        <Alert variant={result.ok ? 'success' : 'destructive'}>
          {result.ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save attendance
        </Button>
      </div>
    </form>
  );
}
