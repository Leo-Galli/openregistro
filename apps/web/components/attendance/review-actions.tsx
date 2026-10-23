'use client';

import { useActionState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@openregistro/ui';
import { reviewJustification, type ReviewFormState } from '@/app/dashboard/attendance/actions';

const initialState: ReviewFormState = { ok: false };

export function ReviewActions({ justificationId }: { justificationId: string }) {
  const [, formAction] = useActionState(reviewJustification, initialState);

  return (
    <div className="flex gap-2">
      <form action={formAction}>
        <input type="hidden" name="justificationId" value={justificationId} />
        <input type="hidden" name="decision" value="approved" />
        <Button type="submit" size="sm" variant="outline">
          <Check className="h-4 w-4" /> Approve
        </Button>
      </form>
      <form action={formAction}>
        <input type="hidden" name="justificationId" value={justificationId} />
        <input type="hidden" name="decision" value="rejected" />
        <Button type="submit" size="sm" variant="ghost">
          <X className="h-4 w-4" /> Reject
        </Button>
      </form>
    </div>
  );
}
