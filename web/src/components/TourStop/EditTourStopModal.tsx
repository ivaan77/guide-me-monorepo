import { TourGuideStop } from '@/app/tour/add/page'
import { FileInput } from '@/components/FileUpload'
import { useLoading } from '@/components/Loading/useLoading'
import { Map } from '@/components/Map'
import { editTourSpot } from '@/utils/api'
import { CoordinateMapper } from '@/utils/mapppers'
import {
    Button,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    useDisclosure,
    useToast,
} from '@chakra-ui/react'
import { City, EditTourSpotRequest, OnClickHandler, OnValueChangeHandler } from '@guide-me-app/core'
import { ReactElement, useState } from 'react'
import { EDITED_SUFFIX } from '@/constants/tour'

type Props = {
    onEdit: OnValueChangeHandler<TourGuideStop>
    stop: TourGuideStop
    city: City
    renderActivator: (onOpen: OnClickHandler) => ReactElement
}

export const EditTourStopModal = ({
    city,
    onEdit,
    stop: _stop,
    renderActivator,
}: Props): ReactElement => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [stop, setStop] = useState<TourGuideStop>(_stop)
    const toast = useToast()
    const { withLoading } = useLoading()

    const updateStop = (value: Partial<TourGuideStop>): void => {
        setStop((prevState) => {
            return {
                ...prevState,
                ...value,
            }
        })
    }

    const handleSave = async (): Promise<void> => {
        if (
            stop.name.trim().length < 3 ||
            !stop.audio.length ||
            !stop.images.length ||
            !stop.coordinate
        ) {
            toast({
                title: 'Tour Stop',
                description: 'Missing mandatory data',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
            return
        }

        if (!stop.id) {
            toast({
                title: 'Tour Stop',
                description: 'Missing id',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
            return
        }

        const req: EditTourSpotRequest = {
            id: stop.id,
            audio: stop.audio,
            introAudio: stop.introAudio,
            outroAudio: stop.outroAudio,
            name: stop.name,
            images: stop.images,
            location: {
                longitude: stop.coordinate.lng,
                latitude: stop.coordinate.lat,
            },
        }

        try {
            const { data } = await withLoading(editTourSpot(req))
            onEdit({ ...data, coordinate: CoordinateMapper.fromCoordinateToGoogle(data.location) })
            toast({
                title: 'Tour Stop',
                description: 'Tour stop added',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })
        } catch (e) {
            toast({
                title: 'Tour Stop',
                description: 'Failed to add tour stop',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
            console.log(e)
        }
    }

    return (
        <>
            {renderActivator(onOpen)}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent minW={600}>
                    <ModalHeader>Edit {_stop.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl isRequired>
                            <FormLabel>Stop name</FormLabel>
                            <Input
                                value={stop.name}
                                onChange={(event) => updateStop({ name: event.target.value })}
                                placeholder="Stop name"
                            />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Spot</FormLabel>
                            <div style={{ height: '400px' }}>
                                <Map
                                    initialCenter={stop.coordinate!}
                                    zoom={12}
                                    onDoubleClick={(coordinate) => updateStop({ coordinate })}
                                    markers={
                                        stop.coordinate
                                            ? [
                                                  CoordinateMapper.fromGoogleToMarkerInfo(
                                                      stop.coordinate,
                                                  ),
                                              ]
                                            : []
                                    }
                                />
                            </div>
                        </FormControl>
                        <section style={{ marginTop: '1rem' }}>
                            <Text fontSize="sm">
                                To be able to upload files add stop name first
                            </Text>
                            <FormControl isRequired>
                                <FormLabel>Audio</FormLabel>
                                <FileInput
                                    disabled={!city?.name || stop.name.trim().length < 3}
                                    accept={'audio/*'}
                                    multiple={false}
                                    folder={`${city?.name}/${stop.name}/${EDITED_SUFFIX}/`}
                                    onUpload={(audio) => updateStop({ audio: audio[0].url })}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Audio to play until next stop reached</FormLabel>
                                <FileInput
                                    disabled={!city?.name || stop.name.trim().length < 3}
                                    accept={'audio/*'}
                                    multiple={false}
                                    folder={`${city?.name}/${stop.name}/introAudio/${EDITED_SUFFIX}/`}
                                    onUpload={(introAudio) =>
                                        updateStop({
                                            introAudio: introAudio.length
                                                ? introAudio[0].url
                                                : null,
                                        })
                                    }
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Audio to play before leaving stop</FormLabel>
                                <FileInput
                                    disabled={!city?.name || stop.name.trim().length < 3}
                                    accept={'audio/*'}
                                    multiple={false}
                                    folder={`${city?.name}/${stop.name}/outroAudio/${EDITED_SUFFIX}/`}
                                    onUpload={(outroAudio) =>
                                        updateStop({
                                            outroAudio: outroAudio.length
                                                ? outroAudio[0].url
                                                : null,
                                        })
                                    }
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Image</FormLabel>
                                <FileInput
                                    multiple
                                    disabled={!city?.name || stop.name.trim().length < 3}
                                    accept={'image/*'}
                                    folder={`${city?.name}/${stop.name}/${EDITED_SUFFIX}/`}
                                    onUpload={(images) =>
                                        updateStop({ images: images.map((image) => image.url) })
                                    }
                                />
                            </FormControl>
                        </section>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Close
                        </Button>
                        <Button
                            isDisabled={isSaveDisabled(stop)}
                            colorScheme="blue"
                            onClick={handleSave}
                        >
                            Edit
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}

const isSaveDisabled = (stop: TourGuideStop): boolean => {
    return (
        stop.name.trim().length < 3 ||
        stop.images.length == 0 ||
        stop.audio.length == 0 ||
        !stop.coordinate
    )
}
