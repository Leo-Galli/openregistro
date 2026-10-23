'use client';

import { useEffect } from 'react';
import { markAnnouncementRead } from '@/app/dashboard/announcements/actions';

export function MarkReadOnView({ announcementId }: { announcementId: string }) {
  useEffect(() => {
    void markAnnouncementRead(announcementId);
  }, [announcementId]);

  return null;
}
