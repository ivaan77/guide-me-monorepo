import {
    Button,
    Flex,
    Table,
    TableCaption,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon, CloseIcon } from '@chakra-ui/icons'
import { EditTourStopModal } from '@/components/TourStop/EditTourStopModal'
import { BRAND_COLOR, City, OnValueChangeHandler } from '@guide-me-app/core'
import { TourGuidePlace, TourGuideStop } from '@/app/tour/add/page'
import { getCity } from '@/utils/resolvers'
import { ViewMapModal } from '@/components/TourStop/ViewMapModal'
import { ListenSoundLink } from '@/components/ActionButtons/ListenSoundLink'
import { ImagePreview } from '@/components/ActionButtons/ImagePreview'

type Props = {
    tourPlace: TourGuidePlace
    cities: City[]
    removeStop?: OnValueChangeHandler<string>
    editStop?: OnValueChangeHandler<TourGuideStop>
}

export const TourStopTable = ({ tourPlace, cities, editStop, removeStop }: Props) => {
    if (!tourPlace.tourSpots.length) {
        return <Text fontSize="md">No stops</Text>
    }

    const displayActions = removeStop || editStop

    return (
        <TableContainer>
            <Table variant="simple">
                <TableCaption>Tour guide stops</TableCaption>
                <Thead>
                    <Tr>
                        <Th>Id</Th>
                        <Th>Name</Th>
                        <Th>Coordinates</Th>
                        <Th>Images</Th>
                        <Th>Audio</Th>
                        <Th>Intro</Th>
                        <Th>Outro</Th>
                        {displayActions && <Th>Actions</Th>}
                    </Tr>
                </Thead>
                <Tbody>
                    {tourPlace.tourSpots.map((stop: TourGuideStop) => (
                        <Tr key={stop.id}>
                            <Td>{stop.id}</Td>
                            <Td>{stop.name}</Td>
                            <Td>
                                {stop.coordinate && (
                                    <ViewMapModal
                                        coordinates={[stop.coordinate]}
                                        renderActivator={(onOpen) => (
                                            <Button onClick={onOpen}>View on Map</Button>
                                        )}
                                    />
                                )}
                            </Td>
                            <Td>
                                {stop.images.map((image) => (
                                    <ImagePreview key={image} image={image} alt={stop.name} />
                                ))}
                            </Td>
                            <Td>
                                <ListenSoundLink audio={stop.audio} />
                            </Td>
                            <Td>
                                {stop.introAudio ? (
                                    <ListenSoundLink audio={stop.introAudio} />
                                ) : (
                                    <CloseIcon w={4} h={4} color="red.500" />
                                )}
                            </Td>
                            <Td>
                                {stop.outroAudio ? (
                                    <ListenSoundLink audio={stop.outroAudio} />
                                ) : (
                                    <CloseIcon w={4} h={4} color="red.500" />
                                )}
                            </Td>
                            <Td>
                                <Flex flexDirection="row" gap={2}>
                                    {stop.id && removeStop && (
                                        <Tooltip hasArrow fontSize="md" label="Delete spot">
                                            <DeleteIcon
                                                w={4}
                                                h={4}
                                                color="red.500"
                                                onClick={() => removeStop(stop.id!)}
                                            />
                                        </Tooltip>
                                    )}
                                    {editStop && (
                                        <EditTourStopModal
                                            onEdit={editStop}
                                            stop={stop}
                                            city={getCity(cities, tourPlace.cityId)}
                                            renderActivator={(onOpen) => (
                                                <Tooltip hasArrow fontSize="md" label="Edit spot">
                                                    <EditIcon
                                                        color={BRAND_COLOR}
                                                        cursor="pointer"
                                                        onClick={onOpen}
                                                    />
                                                </Tooltip>
                                            )}
                                        />
                                    )}
                                </Flex>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
    )
}
