'use client'

import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton'
import { useLoading } from '@/components/Loading/useLoading'
import { EditDirectionsModal } from '@/components/TourStop/EditDirectionsModal'
import { AddTourStopModal } from '@/components/TourStop/AddTourStopModal'
import { Flex, FormControl, FormLabel, Input, Select } from '@chakra-ui/react'
import { IntroOutroUploader } from '@/components/AudioUploader'
import { useCities } from '@/hooks/city/useCities'
import { useEditTour } from '@/hooks/tour/useEditTour'
import { INITIAL_TOUR_GUIDE_PLACE } from '@/constants/tour'
import { TourActionsFooter } from '@/components/Tour/TourActionsFooter'
import { TourStopTable } from '@/components/TourStop/TourStopTable'

export default function TourGuideAdd() {
    const { isLoading } = useLoading()
    const { cities } = useCities()
    const {
        tourPlace,
        updatePlace,
        addStop,
        addDirections,
        onDeleteSpot,
        onSave,
        onCancel,
        onUploadedOutroAudio,
        onUploadedIntroAudio,
    } = useEditTour(INITIAL_TOUR_GUIDE_PLACE)

    if (isLoading) {
        return <LoadingSkeleton />
    }

    const initialCoordinates = cities.find((city) => city.id == tourPlace.cityId)?.location

    return (
        <Flex flexDirection="column" padding={16} pb={32}>
            <h3>Add Tour Guide</h3>
            <Flex flexDirection="column">
                <FormControl isRequired>
                    <FormLabel>Tour city</FormLabel>
                    <Select
                        value={tourPlace?.cityId}
                        placeholder="Select city"
                        onChange={(event) => updatePlace({ cityId: event.target.value })}
                    >
                        {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                                {city.name}
                            </option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Tour name</FormLabel>
                    <Input
                        value={tourPlace.name}
                        onChange={(event) => updatePlace({ name: event.target.value })}
                        placeholder="Tour name"
                    />
                </FormControl>
                <FormControl>
                    <IntroOutroUploader
                        disabled={tourPlace.name.length < 3}
                        folder={tourPlace.name}
                        onUploadIntro={onUploadedIntroAudio}
                        onUploadOutro={onUploadedOutroAudio}
                    />
                </FormControl>
            </Flex>
            <Flex flexDirection="column" gap={4}>
                <TourStopTable tourPlace={tourPlace} cities={cities} removeStop={onDeleteSpot} />
                <AddTourStopModal
                    onSave={addStop}
                    city={cities.find((city) => city.id == tourPlace.cityId)}
                />
                <EditDirectionsModal
                    onSave={addDirections}
                    place={tourPlace}
                    initialCoordinates={initialCoordinates}
                />
            </Flex>
            <TourActionsFooter tourPlace={tourPlace} onSave={onSave} onCancel={onCancel} />
        </Flex>
    )
}
