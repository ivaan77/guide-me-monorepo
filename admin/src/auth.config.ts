import type { NextAuthConfig } from 'next-auth'

// Edge-safe config: no Node-only deps (bcrypt etc). Middleware uses this.
// The full config (src/auth.ts) extends this with the credentials provider.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const isOnLogin = nextUrl.pathname.startsWith('/login')
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
        return true
      }
      return isLoggedIn
    },
  },
}
