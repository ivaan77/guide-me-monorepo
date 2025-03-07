import { Header } from '@/components/Header'
import { LoadingProvider } from '@/components/Loading/LoadingContext'
import { Flex } from '@chakra-ui/react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ReactNode } from 'react'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'GuideMe! admin app',
    description: 'App for managing GuideMe! mobile app data',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en">
            <body className={inter.className} suppressHydrationWarning>
                <LoadingProvider>
                    <Providers>
                        <Flex flex={1} flexDirection="column">
                            <Header />
                            <section style={{ margin: '2rem' }}>{children}</section>
                        </Flex>
                    </Providers>
                </LoadingProvider>
            </body>
        </html>
    )
}
