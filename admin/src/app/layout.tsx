import type { Metadata } from 'next'
import { Bricolage_Grotesque, Geist } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-bricolage',
})

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist',
})

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
    <html lang="en" className={`${bricolage.variable} ${geist.variable}`}>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
        <SessionProvider>{children}</SessionProvider>
        <Toaster richColors closeButton />
      </body>
    </html>
  )
}
