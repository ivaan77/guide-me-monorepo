import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Guide Me',
  description: 'Audio-guided city tours and curated picks. Coming soon.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
