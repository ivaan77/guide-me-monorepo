'use client';

import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton';
import { useLoading } from '@/components/Loading/useLoading';
import { EditTourStopModal } from '@/components/TourStop/EditTourStopModal';
import { TourStopTable } from '@/components/TourStop/TourStopTable';
import { getAllCities } from '@/utils/api';
import {
    Flex,
    FormControl,
    FormLabel,
    Input,
    Select,
    useToast
} from '@chakra-ui/react';
import { City, Nullable } from '@guide-me-app/core';
import { useEffect, useState } from 'react';

type TourGuidePlace = {
    cityId: string | undefined;
    name: string;
    stops: TourGuideStop[];
}

export type TourGuideStop = {
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

export default function TourGuideAdd() {
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
        <Flex flexDirection="column" padding={16}>
            <h3>Add Tour Guide</h3>
            <Flex flexDirection="column">
                <FormControl isRequired>
                    <FormLabel>Tour city</FormLabel>
                    <Select value={tourPlace.cityId} placeholder="Select city" onChange={event => updatePlace({ cityId: event.target.value })}>
                        {cities.map(city => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Tour name</FormLabel>
                    <Input value={tourPlace.name} onChange={event => updatePlace({ name: event.target.value })} placeholder="Tour name"/>
                </FormControl>
            </Flex>
            <Flex flexDirection="column">
                <TourStopTable stops={tourPlace.stops} />
                <EditTourStopModal onSave={addStop} cityId={tourPlace.cityId}/>
            </Flex>
        </Flex>
    );
}
