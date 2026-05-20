import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GuideMe — audio-guided city tours',
  description:
    'Discover cities through curated walking tours, hand-picked restaurants, bars, and shops — narrated, mapped, and ready when you are.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
