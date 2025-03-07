import { Button, Flex, Image } from '@chakra-ui/react'
import { BRAND_COLOR } from '@guide-me-app/core'
import Link from 'next/link'

export default function Home() {
    return (
        <section style={{ width: '100%', height: '600px' }}>
            <Flex flexDirection="column" justifyContent="space-between" height="100%">
                <Flex justifyContent="center" alignItems="center" flex={0.5}>
                    <Image alt="guide me logo" src="/images/logo-blue.png" />
                </Flex>
                <Flex justifyContent="center" flex={1} gap={8} alignItems="center">
                    <Button background={BRAND_COLOR}>
                        <Link href="./city">Cities</Link>
                    </Button>
                    <Button background={BRAND_COLOR}>
                        <Link href="./tour">Tours</Link>
                    </Button>
                    <Button background={BRAND_COLOR}>
                        <Link href="./dashboard">Dashboard</Link>
                    </Button>
                </Flex>
            </Flex>
        </section>
    )
}
