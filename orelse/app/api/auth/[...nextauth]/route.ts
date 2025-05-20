// app/api/auth/[...nextauth]/route.ts
import NextAuth, {
  NextAuthOptions,
  User as OriginalNextAuthUser, // Alias for the original User type from next-auth
  Session as OriginalNextAuthSession, // Alias for the original Session type
  Account,
  Profile
} from 'next-auth';
import { JWT as OriginalNextAuthJWT } from 'next-auth/jwt'; // Alias for the original JWT type
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/src/lib/prisma';

// --- Environment Variable Checks ---
if (!process.env.GOOGLE_CLIENT_ID) { throw new Error('Missing GOOGLE_CLIENT_ID in .env'); }
if (!process.env.GOOGLE_CLIENT_SECRET) { throw new Error('Missing GOOGLE_CLIENT_SECRET in .env'); }
if (!process.env.NEXTAUTH_SECRET) { throw new Error('Missing NEXTAUTH_SECRET in .env'); }

/**
 * Module Augmentation for NextAuth types.
 * This allows us to add custom properties to the Session and JWT interfaces
 * that TypeScript can recognize throughout the application.
 */
declare module 'next-auth' {
  interface Session extends OriginalNextAuthSession {
    user?: {
      id?: string | null;
    } & Omit<OriginalNextAuthUser, 'id'>;
  }

  // No need to redefine `interface User` here if PrismaAdapter handles mapping `id` correctly
  // to the user object passed to the jwt callback.
}

declare module 'next-auth/jwt' {
  interface JWT extends OriginalNextAuthJWT {
    id?: string;
  }
}

// authOptions should be a local constant, NOT exported from a route.ts file.
const authOptions: NextAuthOptions = { // <--- ENSURE THIS IS 'const', NOT 'export const'
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account: _account, profile: _profile }: { // Prefixed unused account & profile
      token: OriginalNextAuthJWT;
      user?: OriginalNextAuthUser; // User from adapter/provider. PrismaAdapter provides user with 'id: string'.
      account?: Account | null;
      profile?: Profile;
    }) {
      if (user && user.id) {
        // The 'id' on 'token' is made available by our 'declare module "next-auth/jwt"' augmentation
        token.id = user.id;
      }
      return token; // NextAuth expects the original token type or a compatible one due to augmentation
    },
    async session({ session, token }: {
      session: OriginalNextAuthSession; // Incoming session is original
      token: JWT; // Incoming token is our augmented JWT from the jwt callback
    }) {
      if (token.id && session.user) {
        // The 'id' on 'session.user' is made available by our 'declare module "next-auth"' augmentation
        session.user.id = token.id;
      }
      return session; // The returned session now implicitly matches our augmented Session type
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

const handler = NextAuth(authOptions);

// These are the only valid top-level exports for a route.ts file in the App Router
export { handler as GET, handler as POST };