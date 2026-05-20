import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Guide Me · Admin',
  description: 'Manage Discover content for the Guide Me app.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
        <SessionProvider>{children}</SessionProvider>
        <Toaster richColors closeButton />
      </body>
    </html>
  )
}
