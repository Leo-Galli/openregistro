'use client';

import { useActionState } from 'react';
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import { saveLessonLog, type LessonLogFormState } from '@/app/dashboard/register/[classId]/actions';

const initialState: LessonLogFormState = { ok: false };

interface SubjectOption {
  id: string;
  label: string;
}

export function LessonLogForm({
  classId,
  date,
  subjects,
}: {
  classId: string;
  date: string;
  subjects: SubjectOption[];
}) {
  const [state, formAction] = useActionState(saveLessonLog, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="date" value={date} />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subjectId">Subject</Label>
          <Select name="subjectId">
            <SelectTrigger id="subjectId">
              <SelectValue placeholder="Choose a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.subjectId ? (
            <p className="text-sm text-destructive">{state.fieldErrors.subjectId}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hourSlot">Hour</Label>
          <Select name="hourSlot" defaultValue="1">
            <SelectTrigger id="hourSlot">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 8 }, (_, index) => index + 1).map((hour) => (
                <SelectItem key={hour} value={String(hour)}>
                  Hour {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="topic">Lesson topic</Label>
        <Textarea
          id="topic"
          name="topic"
          rows={3}
          placeholder="What did the class cover today?"
          required
        />
        {state.fieldErrors?.topic ? (
          <p className="text-sm text-destructive">{state.fieldErrors.topic}</p>
        ) : null}
      </div>

      {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}
      {state.ok ? <p className="text-sm text-success">Lesson logged and signed.</p> : null}

      <div className="flex justify-end">
        <SubmitButton>Sign and save</SubmitButton>
      </div>
    </form>
  );
}
