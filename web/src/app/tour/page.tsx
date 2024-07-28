'use client';

import { UploadResponse } from '@/app/api/upload/route';
import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton';
import { useLoading } from '@/components/Loading/useLoading';
import { Map } from '@/components/Map';
import { getAllCities, saveTourSpot, uploadFile } from '@/utils/api';
import {
    Box,
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
    Select,
    Table,
    TableCaption,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useDisclosure,
    useToast
} from '@chakra-ui/react';
import { AllCityResponse, City, CreateTourSpotRequest, Nullable, OnValueChangeHandler, TourSpotResponse } from '@guide-me-app/core';
import { ReactElement, useEffect, useState } from 'react';

type TourGuidePlace = {
    cityId: string | undefined;
    name: string;
    stops: TourGuideStop[];
}

const INITIAL_TOUR_GUIDE_STOP: TourGuideStop = {
    id: null,
    name: '',
    coordinate: null,
    audio: [],
    images: [],
};

type TourGuideStop = {
    id: Nullable<string>;
    name: string;
    coordinate: Nullable<google.maps.LatLngLiteral>;
    audio: string[];
    images: string[];
}

const INITIAL_TOUR_GUIDE_PLACE: TourGuidePlace = {
    cityId: undefined,
    name: '',
    stops: [],
};

export default function Tour() {
    const [cities, setCities] = useState<City[]>([]);
    const [tourPlace, setTourPlace] = useState<TourGuidePlace>(INITIAL_TOUR_GUIDE_PLACE);
    const { isLoading, withLoading } = useLoading();
    const toast = useToast();

    useEffect(() => {
        fetchAllCities();
    }, []);

    const fetchAllCities = async (): Promise<void> => {
        try {
            const { data } = await withLoading(getAllCities<AllCityResponse>());
            setCities(data.cities);
        } catch (e) {
            toast({
                title: 'City',
                description: 'Failed loading cities',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const updatePlace = (value: Partial<TourGuidePlace>): void => {
        setTourPlace(prevState => {
            return {
                ...prevState,
                ...value
            };
        });
    };

    const addStop = (value: TourGuideStop): void => {
        setTourPlace(prevState => {
            return {
                ...prevState,
                stops: [
                    ...prevState.stops,
                    value
                ]
            };
        });
    };

    if (isLoading) {
        return <LoadingSkeleton/>;
    }

    return (
        <Box display="flex" flexDirection="column" width="90%" alignItems="center" justifyContent="space-around" flex={1}>
            <h3>Cities</h3>
            <FormControl isRequired>
                <FormLabel>Tour city</FormLabel>
                <Select value={tourPlace.cityId} placeholder="Select option" onChange={event => updatePlace({ cityId: event.target.value })}>
                    {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl isRequired>
                <FormLabel>Tour name</FormLabel>
                <Input value={tourPlace.name} onChange={event => updatePlace({ name: event.target.value })} placeholder="Tour name"/>
            </FormControl>
            <FormControl isRequired>
                <FormLabel>Tour stops</FormLabel>
                {tourPlace.stops.length == 0 ? (<Text fontSize="md">No stops</Text>) : (
                    <TableContainer>
                        <Table variant="simple">
                            <TableCaption>Tour guide stops</TableCaption>
                            <Thead>
                                <Tr>
                                    <Th>Id</Th>
                                    <Th>Name</Th>
                                    <Th>Images</Th>
                                    <Th>Audio</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {tourPlace.stops.map(stop => (
                                    <Tr key={stop.id}>
                                        <Td>{stop.id}</Td>
                                        <Td>{stop.name}</Td>
                                        <Td>{stop.images.length} image{stop.images.length > 1 ? 's' : ''}</Td>
                                        <Td>{stop.audio.length} audio{stop.audio.length > 1 ? 's' : ''}</Td>
                                        <Td></Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                )}
                <AddTourStop onSave={addStop} city={tourPlace.cityId}/>
            </FormControl>
        </Box>
    );
}

type AddStopProps = {
    onSave: OnValueChangeHandler<TourGuideStop>;
    city: string | undefined;
}

function AddTourStop({ onSave, city }: AddStopProps) {
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
        console.log(stop);
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
            const { data } = await withLoading(saveTourSpot(req)) as TourSpotResponse;
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

type Props = {
    multiple: boolean;
    accept: string;
    onUpload: OnValueChangeHandler<UploadResponse[]>;
}

const FileInput = ({ accept, onUpload, multiple }: Props): ReactElement => {
    const handleUploadFile = async (event): Promise<void> => {
        const files = event.target.files as FileList;
        const f = Object.values(files);
        try {
            if (f.length > 0) {
                const a = await Promise.all(f.map(uploadFile));
                const c = a.map(b => b.data);
                onUpload(c);
            }
        } catch (e) {
            console.log('Error', e);
        }

    };

    return (
        <span>
            <input type="file" multiple={multiple} accept={accept} onChange={handleUploadFile}/>
        </span>
    );
};