import { TourGuideStop } from '@/app/tour/add/page';
import { FileInput } from '@/components/FileUpload';
import { useLoading } from '@/components/Loading/useLoading';
import { Map } from '@/components/Map';
import { saveTourSpot } from '@/utils/api';
import { CoordinateMapper } from '@/utils/mapppers';
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
    useDisclosure,
    useToast
} from '@chakra-ui/react';
import { City, CreateTourSpotRequest, OnValueChangeHandler } from '@guide-me-app/core';
import { ReactElement, useState } from 'react';

const INITIAL_TOUR_GUIDE_STOP: TourGuideStop = {
    id: null,
    name: '',
    coordinate: null,
    audio: [],
    images: [],
};

type Props = {
    onSave: OnValueChangeHandler<TourGuideStop>;
    city: City | undefined;
}

export const EditTourStopModal = ({ onSave, city }: Props): ReactElement => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [stop, setStop] = useState<TourGuideStop>(INITIAL_TOUR_GUIDE_STOP);
    const toast = useToast();
    const { withLoading } = useLoading();

    const updateStop = (value: Partial<TourGuideStop>): void => {
        setStop(prevState => {
            return {
                ...prevState,
                ...value
            };
        });
    };

    const handleSave = async (): Promise<void> => {
        if (stop.name.trim().length < 3 || !stop.audio.length || !stop.images.length || !stop.coordinate) {
            toast({
                title: 'Tour Stop',
                description: 'Missing mandatory data',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (!city) {
            toast({
                title: 'Tour Stop',
                description: 'Missing city data',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const req: CreateTourSpotRequest = {
            audio: stop.audio[0]!,
            name: stop.name!,
            images: stop.images!,
            location: {
                longitude: stop.coordinate.lng,
                latitude: stop.coordinate.lat
            }
        };

        try {
            const { data } = await withLoading(saveTourSpot(req));
            onSave({ ...stop, id: data.id });
        } catch (e) {
            console.log(e);
        }
    };

    console.log(stop.coordinate)

    return (
        <>
            <Button isDisabled={!city} onClick={onOpen}>Add Stop</Button>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay/>
                <ModalContent minW={600}>
                    <ModalHeader>Add new Tour guide stop</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody>
                        <FormControl isRequired>
                            <FormLabel>Stop name</FormLabel>
                            <Input value={stop.name} onChange={event => updateStop({ name: event.target.value })} placeholder="Stop name"/>
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Spot</FormLabel>
                            <div style={{ height: '400px' }}>
                                <Map zoom={12} onDoubleClick={coordinate => updateStop({ coordinate })}
                                     markers={stop.coordinate ? [CoordinateMapper.fromGoogleToMarkerInfo(stop.coordinate)] : []}/>
                            </div>
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Audio</FormLabel>
                            <FileInput disabled={!city?.name || stop.name.trim().length <3} accept={'audio/*'} multiple={false} folder={`${city?.name}/${stop.name}`} onUpload={audio => updateStop({ audio: audio.map(audio => audio.url) })}/>
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Image</FormLabel>
                            <FileInput disabled={!city?.name || stop.name.trim().length <3 } accept={'image/*'} multiple folder={`${city?.name}/${stop.name}`} onUpload={images => updateStop({ images: images.map(image => image.url) })}/>
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Close
                        </Button>
                        <Button colorScheme="blue" onClick={handleSave}>Save</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};
