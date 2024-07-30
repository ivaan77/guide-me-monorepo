'use client';

import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton';
import { useLoading } from '@/components/Loading/useLoading';
import { getAllCities, saveTourSpot } from '@/utils/api';
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
import { City, CreateTourSpotRequest, Nullable, OnValueChangeHandler } from '@guide-me-app/core';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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

type Params = {
    id: string
}


export default function TourAdd() {
    const [cities, setCities] = useState<City[]>([]);
    const [tourPlace, setTourPlace] = useState<TourGuidePlace>(INITIAL_TOUR_GUIDE_PLACE);
    const { isLoading, withLoading } = useLoading();
    const toast = useToast();

    useEffect(() => {
        fetchAllCities();
    }, []);

    const fetchAllCities = async (): Promise<void> => {
        try {
            const { data } = await withLoading(getAllCities());
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
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Audio</FormLabel>
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Image</FormLabel>
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
