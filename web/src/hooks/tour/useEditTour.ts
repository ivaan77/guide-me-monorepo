import { useEffect, useState } from 'react'
import { TourGuidePlace, TourGuideStop } from '@/app/tour/add/page'
import { Coordinates, CreateTourGuideRequest, EditTourGuideRequest } from '@guide-me-app/core'
import { UploadResponse } from '@/app/api/upload/route'
import { deleteTourSpot, editTourGuide, saveTourGuide } from '@/utils/api'
import { useToast } from '@chakra-ui/react'
import { useLoading } from '@/components/Loading/useLoading'
import { useRouter } from 'next/navigation'

export const useEditTour = (initialValue: TourGuidePlace) => {
    const [tourPlace, setTourPlace] = useState<TourGuidePlace>(() => initialValue)
    const toast = useToast()
    const router = useRouter()
    const { withLoading } = useLoading()

    useEffect(() => {
        setTourPlace(initialValue)
    }, [initialValue.id])

    const updatePlace = (value: Partial<TourGuidePlace>): void => {
        setTourPlace((prevState) => {
            return {
                ...prevState,
                ...value,
            }
        })
    }

    const addStop = (value: TourGuideStop): void => {
        setTourPlace((prevState) => {
            return {
                ...prevState,
                tourSpots: [...prevState.tourSpots, value],
            }
        })
    }

    const editStop = (value: TourGuideStop): void => {
        setTourPlace((prevState) => {
            return {
                ...prevState,
                tourSpots: prevState.tourSpots.map((tourSpot) => {
                    if (tourSpot.id === value.id) {
                        return value
                    }

                    return tourSpot
                }),
            }
        })
    }

    const removeStop = (id: string): void => {
        setTourPlace((prevState) => {
            return {
                ...prevState,
                tourSpots: prevState.tourSpots.filter((spot) => spot.id !== id),
            }
        })
    }

    const addDirections = (directions: Coordinates[]): void => updatePlace({ directions })

    const onUploadedIntroAudio = (audio: UploadResponse[]) => {
        setTourPlace((prevState) => {
            return {
                ...prevState,
                introAudio: audio.length ? audio[0].url : null,
            }
        })
    }

    const onUploadedOutroAudio = (audio: UploadResponse[]) => {
        setTourPlace((prevState) => {
            return {
                ...prevState,
                outroAudio: audio.length ? audio[0].url : null,
            }
        })
    }

    const onDeleteSpot = async (spotId: string): Promise<void> => {
        try {
            await withLoading(deleteTourSpot(spotId))

            toast({
                title: 'Tour Spot',
                description: 'Successfully deleted spot',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            setTourPlace((prevState) => {
                return {
                    ...prevState,
                    tourSpots: prevState.tourSpots.filter((stop) => stop.id != spotId),
                }
            })
        } catch (e) {
            toast({
                title: 'Tour',
                description: 'Error deleting spot',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const onSave = async (): Promise<void> => {
        if (!isValidTour(tourPlace)) {
            return
        }

        try {
            const request: CreateTourGuideRequest = {
                name: tourPlace.name,
                city: tourPlace.cityId!,
                tourSpots: tourPlace.tourSpots.map((stop) => stop.id!) as string[],
                directions: tourPlace.directions,
                introAudio: tourPlace.introAudio,
                outroAudio: tourPlace.outroAudio,
            }

            await withLoading(saveTourGuide(request))

            toast({
                title: 'Tour',
                description: 'Successfully saved tour guide',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })
        } catch (e) {
            toast({
                title: 'Tour',
                description: 'Error saving tour guide',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const onEdit = async (): Promise<void> => {
        if (!isValidTour(tourPlace)) {
            return
        }

        if (!tourPlace.id) {
            return
        }

        try {
            const request: EditTourGuideRequest = {
                id: tourPlace.id,
                name: tourPlace.name,
                city: tourPlace.cityId!,
                tourSpots: tourPlace.tourSpots.map((stop) => stop.id!) as string[],
                directions: tourPlace.directions,
                introAudio: tourPlace.introAudio,
                outroAudio: tourPlace.outroAudio,
            }

            await withLoading(editTourGuide(tourPlace.id, request))

            toast({
                title: 'Tour',
                description: 'Successfully edited tour guide',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })
        } catch (e) {
            toast({
                title: 'Tour',
                description: 'Error editing tour guide',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const isValidTour = (tourPlace: TourGuidePlace) => {
        if (tourPlace.name.trim().length == 0) {
            toast({
                title: 'Tour',
                description: 'Missing tour place name',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
            return false
        }

        if (!tourPlace.cityId) {
            toast({
                title: 'Tour',
                description: 'Missing city',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
            return false
        }

        if (tourPlace.tourSpots.length == 0) {
            toast({
                title: 'Tour',
                description: 'Missing tour place stops',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
            return false
        }

        if (tourPlace.directions.length == 0) {
            toast({
                title: 'Tour',
                description: 'Missing tour place directions',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
            return false
        }

        return true
    }

    const onCancel = (): void => router.back()

    return {
        tourPlace,
        updatePlace,
        addStop,
        editStop,
        removeStop,
        addDirections,
        onUploadedIntroAudio,
        onUploadedOutroAudio,
        onDeleteSpot,
        onSave,
        onEdit,
        onCancel,
    }
}
