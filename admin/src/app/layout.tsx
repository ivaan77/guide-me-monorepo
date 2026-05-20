import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'GuideMe · Admin',
  description: 'Manage Discover content for the GuideMe app.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
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
