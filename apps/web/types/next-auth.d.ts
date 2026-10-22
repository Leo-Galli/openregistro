import type { Role } from '@openregistro/core';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    role: Role;
    schoolId: string;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      schoolId: string;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: Role;
    schoolId: string;
  }
}
