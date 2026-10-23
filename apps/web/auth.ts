import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { getStorage } from './lib/storage';
import { verifyPassword } from './lib/password';
import { verifyTotpToken } from './lib/totp';
import { checkRateLimit } from './lib/rate-limit';

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 60_000;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totp: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totp: { label: 'Authentication code', type: 'text' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password, totp } = parsed.data;

        const rateLimit = checkRateLimit(
          `login:${email.toLowerCase()}`,
          LOGIN_ATTEMPT_LIMIT,
          LOGIN_ATTEMPT_WINDOW_MS,
        );
        if (!rateLimit.allowed) return null;

        const storage = await getStorage();
        const [user] = await storage.users.findMany({ email });
        if (!user || !user.isActive) return null;

        const passwordMatches = await verifyPassword(user.passwordHash, password);
        if (!passwordMatches) return null;

        if (user.totpSecret) {
          if (!totp || !verifyTotpToken(user.totpSecret, totp)) return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          schoolId: user.schoolId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.schoolId = token.schoolId;
      return session;
    },
  },
});
