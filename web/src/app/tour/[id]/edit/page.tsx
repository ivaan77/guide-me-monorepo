'use client'

import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton'
import { useLoading } from '@/components/Loading/useLoading'
import { Box, Flex, FormControl, FormLabel, Input, Select } from '@chakra-ui/react'

import { useExistingTour } from '@/hooks/tour/useExistingTour'
import { useCities } from '@/hooks/city/useCities'
import { useEditTour } from '@/hooks/tour/useEditTour'
import { TourMapper } from '@/utils/mapppers'
import { AddTourStopModal } from '@/components/TourStop/AddTourStopModal'
import { TourActionsFooter } from '@/components/Tour/TourActionsFooter'
import { EditDirectionsModal } from '@/components/TourStop/EditDirectionsModal'
import { TourStopTable } from '@/components/TourStop/TourStopTable'
import { getCity } from '@/utils/resolvers'
import { FileInput } from '@/components/FileUpload'
import { EDITED_SUFFIX } from '@/constants/tour'
import { ListenSoundLink } from '@/components/ActionButtons/ListenSoundLink'

export default function TourEdit() {
    const { isLoading } = useLoading()
    const { cities } = useCities()
    const { tourGuide } = useExistingTour()
    const {
        tourPlace,
        updatePlace,
        addDirections,
        addStop,
        editStop,
        onEdit,
        onCancel,
        removeStop,
    } = useEditTour(TourMapper.fromTourGuideResponseToTourPlace(tourGuide))

    if (isLoading || !cities.length) {
        return <LoadingSkeleton />
    }

    const city = getCity(cities, tourPlace.cityId)

    return (
        <Flex flexDirection="column" padding={16} pb={32}>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="space-around"
                flex={1}
            >
                <h3>Cities</h3>
                <FormControl isRequired>
                    <FormLabel>Tour city</FormLabel>
                    <Select
                        value={tourPlace.cityId}
                        placeholder="Select option"
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
                    <Flex gap={1} flexDirection="column">
                        <FormLabel>Intro</FormLabel>
                        {tourPlace.introAudio && <ListenSoundLink audio={tourPlace.introAudio} />}
                        <FileInput
                            disabled={!city?.name || stop.name.trim().length < 3}
                            accept={'audio/*'}
                            multiple={false}
                            folder={`${city?.name}/${stop.name}/introAudio/${EDITED_SUFFIX}/`}
                            onUpload={(introAudio) =>
                                updatePlace({
                                    introAudio: introAudio.length ? introAudio[0].url : null,
                                })
                            }
                        />
                    </Flex>
                </FormControl>
                <FormControl>
                    <Flex gap={1} flexDirection="column">
                        <FormLabel>Outro</FormLabel>
                        {tourPlace.outroAudio && <ListenSoundLink audio={tourPlace.outroAudio} />}
                        <FileInput
                            disabled={!city?.name || stop.name.trim().length < 3}
                            accept={'audio/*'}
                            multiple={false}
                            folder={`${city?.name}/${stop.name}/outroAudio/${EDITED_SUFFIX}/`}
                            onUpload={(outroAudio) =>
                                updatePlace({
                                    outroAudio: outroAudio.length ? outroAudio[0].url : null,
                                })
                            }
                        />
                    </Flex>
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Tour stops</FormLabel>
                    <TourStopTable
                        tourPlace={tourPlace}
                        cities={cities}
                        editStop={editStop}
                        removeStop={removeStop}
                    />
                    <AddTourStopModal onSave={addStop} city={getCity(cities, tourPlace.cityId)} />
                    <EditDirectionsModal
                        onSave={addDirections}
                        place={tourPlace}
                        initialCoordinates={tourPlace.directions[0]}
                    />
                </FormControl>
            </Box>
            <TourActionsFooter tourPlace={tourPlace} onSave={onEdit} onCancel={onCancel} />
        </Flex>
    )
}
