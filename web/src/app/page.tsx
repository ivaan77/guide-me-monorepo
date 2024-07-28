import { Button, Flex, Image } from '@chakra-ui/react';
import { BRAND_COLOR } from '@guide-me-app/core';
import Link from 'next/link';

export default function Home() {
    return (
        <>
            <Flex justifyContent="center" alignItems="center" flex={.5}>
                <Image src="/images/logo-blue.png"/>
            </Flex>
            <Flex justifyContent="center" flex={1} gap={8} alignItems="center">
                <Button background={BRAND_COLOR}>
                    <Link href="./city">Cities</Link>
                </Button>
                <Button background={BRAND_COLOR}>
                    <Link href="./dashboard">Dashboard</Link>
                </Button>
            </Flex>
        </>
    );
}
