import { useEffect, useState } from 'react'
import { Nullable, TourGuideResponse } from '@guide-me-app/core'
import { useLoading } from '@/components/Loading/useLoading'
import { useToast } from '@chakra-ui/react'
import { useParams } from 'next/navigation'
import { getTourGuide } from '@/utils/api'

type Params = {
    id: string
}

export const useExistingTour = () => {
    const [tourGuide, setTourGuide] = useState<Nullable<TourGuideResponse>>(null)
    const { withLoading } = useLoading()
    const toast = useToast()
    const { id } = useParams<Params>()

    useEffect(() => {
        fetchTourGuide()
    }, [])

    const fetchTourGuide = async (): Promise<void> => {
        try {
            const { data } = await withLoading(getTourGuide(id))
            setTourGuide(data)
        } catch (e) {
            toast({
                title: 'Tour Guide',
                description: 'Failed loading tour guide',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    return {
        tourGuide,
    }
}
