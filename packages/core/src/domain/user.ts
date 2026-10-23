import { z } from 'zod';
import { brandedId, timestampSchema } from './common';
import { ROLES } from '../rbac/roles';

export const userIdSchema = brandedId('UserId');
export type UserId = z.infer<typeof userIdSchema>;

export const userSchema = z.object({
  id: userIdSchema,
  schoolId: brandedId('SchoolId'),
  role: z.enum(ROLES),
  email: z.string().email(),
  fullName: z.string().min(1).max(200),
  passwordHash: z.string().min(1),
  totpSecret: z.string().min(1).nullable(),
  isActive: z.boolean(),
  lastLoginAt: timestampSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = userSchema
  .omit({
    id: true,
    passwordHash: true,
    totpSecret: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    password: z.string().min(12).max(256),
  });

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

/**
 * Storage-layer input: the password has already been hashed by the auth
 * service before reaching the StorageDriver. Driver implementations must
 * never hash passwords themselves.
 */
export const userRecordInputSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type UserRecordInput = z.infer<typeof userRecordInputSchema>;

export const updateUserInputSchema = userSchema
  .pick({
    fullName: true,
    email: true,
    isActive: true,
    totpSecret: true,
  })
  .partial();

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

/** Public-safe projection of a user, never includes passwordHash or totpSecret. */
export const publicUserSchema = userSchema.omit({ passwordHash: true, totpSecret: true });
export type PublicUser = z.infer<typeof publicUserSchema>;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, totpSecret: _totpSecret, ...publicUser } = user;
  return publicUser;
}
