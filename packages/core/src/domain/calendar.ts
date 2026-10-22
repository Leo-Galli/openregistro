import { z } from 'zod';
import { brandedId, timestampSchema } from './common';
import { classIdSchema, subjectIdSchema } from './academic-structure';

export const weekdaySchema = z.number().int().min(1).max(7);

export const timetableSlotIdSchema = brandedId('TimetableSlotId');
export type TimetableSlotId = z.infer<typeof timetableSlotIdSchema>;

export const timetableSlotSchema = z.object({
  id: timetableSlotIdSchema,
  classId: classIdSchema,
  subjectId: subjectIdSchema,
  teacherId: brandedId('UserId'),
  weekday: weekdaySchema,
  hourSlot: z.number().int().min(1).max(12),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type TimetableSlot = z.infer<typeof timetableSlotSchema>;

export const createTimetableSlotInputSchema = timetableSlotSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateTimetableSlotInput = z.infer<typeof createTimetableSlotInputSchema>;

export const calendarEventTypeSchema = z.enum(['test', 'event', 'holiday']);
export type CalendarEventType = z.infer<typeof calendarEventTypeSchema>;

export const calendarEventIdSchema = brandedId('CalendarEventId');
export type CalendarEventId = z.infer<typeof calendarEventIdSchema>;

export const calendarEventSchema = z.object({
  id: calendarEventIdSchema,
  classId: classIdSchema.nullable(),
  subjectId: subjectIdSchema.nullable(),
  type: calendarEventTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  date: z.string().date(),
  createdBy: brandedId('UserId'),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

export const createCalendarEventInputSchema = calendarEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateCalendarEventInput = z.infer<typeof createCalendarEventInputSchema>;

export const updateCalendarEventInputSchema = createCalendarEventInputSchema
  .pick({ title: true, description: true, date: true })
  .partial();
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventInputSchema>;

export const meetingSlotIdSchema = brandedId('MeetingSlotId');
export type MeetingSlotId = z.infer<typeof meetingSlotIdSchema>;

/** A bookable parent-teacher meeting slot offered by a teacher. */
export const meetingSlotSchema = z.object({
  id: meetingSlotIdSchema,
  teacherId: brandedId('UserId'),
  startsAt: timestampSchema,
  endsAt: timestampSchema,
  location: z.string().max(200).nullable(),
  capacity: z.number().int().min(1).max(10),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type MeetingSlot = z.infer<typeof meetingSlotSchema>;

export const createMeetingSlotInputSchema = meetingSlotSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateMeetingSlotInput = z.infer<typeof createMeetingSlotInputSchema>;

export const updateMeetingSlotInputSchema = createMeetingSlotInputSchema
  .pick({ startsAt: true, endsAt: true, location: true, capacity: true })
  .partial();
export type UpdateMeetingSlotInput = z.infer<typeof updateMeetingSlotInputSchema>;

export const meetingBookingIdSchema = brandedId('MeetingBookingId');
export type MeetingBookingId = z.infer<typeof meetingBookingIdSchema>;

export const meetingBookingSchema = z.object({
  id: meetingBookingIdSchema,
  meetingSlotId: meetingSlotIdSchema,
  guardianId: brandedId('UserId'),
  studentId: brandedId('UserId'),
  notes: z.string().max(500).nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type MeetingBooking = z.infer<typeof meetingBookingSchema>;

export const createMeetingBookingInputSchema = meetingBookingSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateMeetingBookingInput = z.infer<typeof createMeetingBookingInputSchema>;
