import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Edge-safe middleware. It doesn't import bcrypt or the credentials provider —
// only the `authorized` callback runs here, which inspects the session.
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
