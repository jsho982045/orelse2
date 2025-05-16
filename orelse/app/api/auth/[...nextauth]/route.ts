// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/src/lib/prisma';

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('Missing GOOGLE_CLIENT_ID in .env');
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing GOOGLE_CLIENT_SECRET in .env');
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET in .env');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Optional: Configure authorization prompt behavior.
      // "consent" will always ask the user to re-authorize.
      // "select_account" will always ask the user to select an account.
      // By default (if not specified), it will try to reuse existing consent.
      // authorization: {
      //   params: {
      //     prompt: "consent",
      //     access_type: "offline",
      //     response_type: "code"
      //   }
      // }
    }),
    // ...add more providers here if needed (e.g., GitHub, Email)
  ],
  // Optional: Specify custom pages for sign-in, sign-out, error, etc.
  // pages: {
  //   signIn: '/auth/signin',
  //   signOut: '/auth/signout',
  //   error: '/auth/error', // Error code passed in query string as ?error=
  //   verifyRequest: '/auth/verify-request', // (used for email/passwordless login)
  //   newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
  // },
  session: {
    strategy: 'jwt', // Using JWT for session strategy is common, especially with database adapters
  },
  callbacks: {
    // Use JWT callback to persist user ID and other custom properties in the token
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id; // Persist user.id to the token
        // You can add other custom properties from the user model here if needed
        // For example, if you add a 'role' to your User model:
        // token.role = user.role;
      }
      return token;
    },
    // Use session callback to make user ID and custom properties available to the client
    async session({ session, token, user }) {
      // `token.id` comes from the `jwt` callback
      if (token && session.user) {
        (session.user as any).id = token.id; // Add user.id to the session object
        // Add other custom properties from the token to the session user object
        // if (token.role) {
        //   (session.user as any).role = token.role;
        // }
      }
      // `user` object here is the user from the database via the adapter if not using JWT strategy,
      // or a subset if using JWT. With JWT, the `token` object is the source of truth for session data.
      return session;
    },
  },
  // Optional: Add debug messages for NextAuth in development
  // debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET, // This is your NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };