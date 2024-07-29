import { TourGuideStop } from '@/app/tour/add/page';
import { FileInput } from '@/components/FileUpload';
import { useLoading } from '@/components/Loading/useLoading';
import { Map } from '@/components/Map';
import { saveTourSpot } from '@/utils/api';
import {
    Button,
    FormControl,
    FormLabel, Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent, ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
    useToast
} from '@chakra-ui/react';
import { CreateTourSpotRequest, OnValueChangeHandler } from '@guide-me-app/core';
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
    cityId: string | undefined;
}

export const EditTourStopModal = ({ onSave, cityId }: Props):ReactElement => {
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

        if (!cityId) {
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

    return (
        <>
            <Button onClick={onOpen}>Add Stop</Button>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay/>
                <ModalContent>
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
                                <Map onDoubleClick={coordinate => updateStop({ coordinate })} markerPositions={stop.coordinate ? [stop.coordinate] : []}/>
                            </div>
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Audio</FormLabel>
                            <FileInput accept={'audio/*'} multiple={false} onUpload={audio => updateStop({ audio: audio.map(a => a.url) })}/>
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Image</FormLabel>
                            <FileInput accept={'image/*'} multiple onUpload={images => updateStop({ images: images.map(a => a.url) })}/>
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
}
