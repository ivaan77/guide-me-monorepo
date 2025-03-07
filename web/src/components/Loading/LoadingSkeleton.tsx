import { Skeleton, Stack } from '@chakra-ui/react'
import { ReactElement } from 'react'

export const LoadingSkeleton = (): ReactElement => (
    <Stack>
        {[...Array(20)].map((_, i) => (
            <Skeleton key={i} height="30px" />
        ))}
    </Stack>
)
