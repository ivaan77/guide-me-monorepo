import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'

// Full config — used at runtime in Server Components, API routes, and Server
// Actions. Includes bcrypt (Node runtime only). Middleware imports auth.config
// directly to stay edge-safe.
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Admin credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const expectedUsername = process.env.ADMIN_USERNAME
        const expectedHash = process.env.ADMIN_PASSWORD_HASH
        if (!expectedUsername || !expectedHash) return null

        const username = credentials?.username as string | undefined
        const password = credentials?.password as string | undefined
        if (!username || !password) return null
        if (username !== expectedUsername) return null

        const ok = await bcrypt.compare(password, expectedHash)
        if (!ok) return null

        return { id: 'admin', name: expectedUsername }
      },
    }),
  ],
})
