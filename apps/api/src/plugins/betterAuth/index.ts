import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@praxis/database';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    generateId: () => {
      return crypto.randomUUID();
    },
  },
  trustedOrigins: [process.env.CORS_ORIGIN || 'http://localhost:3000'],
});

export function betterAuthHandler(req: any, res: any) {
  return auth.handler(req, res);
}
