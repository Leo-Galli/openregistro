'use server';

import { z } from 'zod';
import { getStorage } from '@/lib/storage';

const schoolFormSchema = z.object({
  name: z.string().min(1, 'Required').max(200),
  address: z.string().max(500).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color like #16304a')
    .optional()
    .or(z.literal('')),
  yearLabel: z.string().min(1, 'Required').max(50),
  startDate: z.string().date(),
  endDate: z.string().date(),
});

export type SchoolFormInput = z.infer<typeof schoolFormSchema>;

export interface SchoolFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<keyof SchoolFormInput, string>>;
  formError?: string;
}

export async function saveSchoolDetails(
  _prevState: SchoolFormState,
  formData: FormData,
): Promise<SchoolFormState> {
  const parsed = schoolFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: SchoolFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof SchoolFormInput;
      fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { name, address, contactEmail, primaryColor, yearLabel, startDate, endDate } = parsed.data;

  if (new Date(endDate) <= new Date(startDate)) {
    return { ok: false, fieldErrors: { endDate: 'Must be after the start date' } };
  }

  try {
    const storage = await getStorage();
    const [existingSchool] = await storage.schools.findMany();

    const schoolInput = {
      name,
      address: address || null,
      contactEmail: contactEmail || null,
      logoUrl: existingSchool?.logoUrl ?? null,
      primaryColor: primaryColor || null,
      usePlatformEmail: existingSchool?.usePlatformEmail ?? false,
    };

    const school = existingSchool
      ? await storage.schools.update(existingSchool.id, schoolInput)
      : await storage.schools.create(schoolInput);

    const [existingYear] = await storage.schoolYears.findMany({ schoolId: school.id });
    const yearInput = { schoolId: school.id, label: yearLabel, startDate, endDate, isActive: true };

    if (existingYear) {
      await storage.schoolYears.update(existingYear.id, yearInput);
    } else {
      await storage.schoolYears.create(yearInput);
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save the school details.',
    };
  }
}
