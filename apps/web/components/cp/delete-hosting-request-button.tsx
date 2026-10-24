'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@openregistro/ui';
import { deleteHostingRequestAction } from '@/app/cp/actions';

export function DeleteHostingRequestButton({ id, schoolName }: { id: string; schoolName: string }) {
  return (
    <form
      action={deleteHostingRequestAction}
      onSubmit={(event) => {
        if (!confirm(`Delete the hosting request from "${schoolName}"? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="outline">
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
    </form>
  );
}
