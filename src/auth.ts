import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
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
