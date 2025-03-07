import { useEffect, useState } from 'react'
import { getAllCities } from '@/utils/api'
import { useLoading } from '@/components/Loading/useLoading'
import { useToast } from '@chakra-ui/react'
import { City } from '@guide-me-app/core'

export const useCities = () => {
    const { withLoading } = useLoading()
    const toast = useToast()
    const [cities, setCities] = useState<City[]>([])

    useEffect(() => {
        fetchAllCities()
    }, [])

    const fetchAllCities = async (): Promise<void> => {
        try {
            const { data } = await withLoading(getAllCities())
            setCities(data.cities)
        } catch (e) {
            toast({
                title: 'City',
                description: 'Failed loading cities',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    return {
        cities,
    }
}
