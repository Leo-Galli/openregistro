import { z } from 'zod';

/**
 * Entity ids are UUID strings branded per entity so that, for example, a
 * `SchoolId` cannot be passed where a `ClassId` is expected, even though both
 * are plain strings at runtime.
 */
export function brandedId<Brand extends string>(_brand: Brand) {
  return z.string().uuid().brand<Brand>();
}

export const timestampSchema = z.string().datetime({ offset: true });
export type Timestamp = z.infer<typeof timestampSchema>;

export const auditedFieldsSchema = z.object({
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
