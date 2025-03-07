import { Flex, Text } from '@chakra-ui/react'
import { BRAND_COLOR } from '@guide-me-app/core'
import { ReactElement } from 'react'

export const Header = (): ReactElement => (
    <Flex
        width="100%"
        style={{ padding: '2rem', background: BRAND_COLOR, justifyContent: 'center' }}
    >
        <Text style={{ fontWeight: 'bold' }}>GuideMe! admin</Text>
    </Flex>
)
