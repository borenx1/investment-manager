import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';

import { db } from '@/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [GitHub],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: async ({ request, auth }) => {
      // Redirect unauthenticated users to the login page.
      if (!auth && request.nextUrl.pathname !== '/login') {
        return Response.redirect(new URL('/login', request.nextUrl.origin));
      }
      // Redirect authenticated users away from the login page.
      if (auth && request.nextUrl.pathname === '/login') {
        return Response.redirect(new URL('/', request.nextUrl.origin));
      }
      return true;
    },
  },
});
