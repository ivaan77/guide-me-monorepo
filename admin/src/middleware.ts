import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Edge-safe middleware. It doesn't import bcrypt or the credentials provider —
// only the `authorized` callback runs here, which inspects the session.
// Next 16 requires the middleware export to be a recognisable function at
// module load time; the destructured rename used to work in Next 15 but
// stopped being picked up, so we wrap explicitly.
const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
