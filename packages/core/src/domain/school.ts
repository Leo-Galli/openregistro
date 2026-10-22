import { z } from 'zod';
import { brandedId, timestampSchema } from './common';

export const schoolIdSchema = brandedId('SchoolId');
export type SchoolId = z.infer<typeof schoolIdSchema>;

export const schoolSchema = z.object({
  id: schoolIdSchema,
  name: z.string().min(1).max(200),
  address: z.string().max(500).nullable(),
  contactEmail: z.string().email().nullable(),
  logoUrl: z.string().url().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type School = z.infer<typeof schoolSchema>;

export const createSchoolInputSchema = schoolSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateSchoolInput = z.infer<typeof createSchoolInputSchema>;

export const updateSchoolInputSchema = createSchoolInputSchema.partial();
export type UpdateSchoolInput = z.infer<typeof updateSchoolInputSchema>;

export const schoolYearIdSchema = brandedId('SchoolYearId');
export type SchoolYearId = z.infer<typeof schoolYearIdSchema>;

export const schoolYearSchema = z.object({
  id: schoolYearIdSchema,
  schoolId: schoolIdSchema,
  label: z.string().min(1).max(50),
  startDate: z.string().date(),
  endDate: z.string().date(),
  isActive: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type SchoolYear = z.infer<typeof schoolYearSchema>;

export const createSchoolYearInputSchema = schoolYearSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateSchoolYearInput = z.infer<typeof createSchoolYearInputSchema>;

export const updateSchoolYearInputSchema = createSchoolYearInputSchema.partial();
export type UpdateSchoolYearInput = z.infer<typeof updateSchoolYearInputSchema>;

export const termKindSchema = z.enum(['trimester', 'semester']);
export type TermKind = z.infer<typeof termKindSchema>;

export const termIdSchema = brandedId('TermId');
export type TermId = z.infer<typeof termIdSchema>;

export const termSchema = z.object({
  id: termIdSchema,
  schoolYearId: schoolYearIdSchema,
  kind: termKindSchema,
  label: z.string().min(1).max(50),
  sequence: z.number().int().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Term = z.infer<typeof termSchema>;

export const createTermInputSchema = termSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateTermInput = z.infer<typeof createTermInputSchema>;

export const updateTermInputSchema = createTermInputSchema.partial();
export type UpdateTermInput = z.infer<typeof updateTermInputSchema>;
