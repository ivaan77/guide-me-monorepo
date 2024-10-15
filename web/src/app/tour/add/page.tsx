'use client';

import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton';
import { useLoading } from '@/components/Loading/useLoading';
import { EditDirectionsModal } from '@/components/TourStop/EditDirectionsModal';
import { EditTourStopModal } from '@/components/TourStop/EditTourStopModal';
import { TourStopTable } from '@/components/TourStop/TourStopTable';
import { deleteTourSpot, getAllCities, saveTourGuide } from '@/utils/api';
import { Button, Flex, FormControl, FormLabel, Input, Select, useToast } from '@chakra-ui/react';
import { BRAND_COLOR, City, Coordinates, CreateTourGuideRequest, Nullable, OnClickHandler } from '@guide-me-app/core';
import { useRouter } from 'next/navigation';
import { ReactElement, useEffect, useState } from 'react';

export type TourGuidePlace = {
    cityId: string | undefined;
    name: string;
    stops: TourGuideStop[];
    directions: Coordinates[];
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
    directions: [],
};

export default function TourGuideAdd() {
    const [cities, setCities] = useState<City[]>([]);
    const [tourPlace, setTourPlace] = useState<TourGuidePlace>(INITIAL_TOUR_GUIDE_PLACE);
    const { isLoading, withLoading } = useLoading();
    const toast = useToast();
    const router = useRouter();

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

    const addDirections = (directions: Coordinates[]): void => updatePlace({ directions });

    const onSave = async (): Promise<void> => {
        if (tourPlace.name.trim().length == 0) {
            toast({
                title: 'Tour',
                description: 'Missing tour place name',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (!tourPlace.cityId) {
            toast({
                title: 'Tour',
                description: 'Missing city',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (tourPlace.stops.length == 0) {
            toast({
                title: 'Tour',
                description: 'Missing tour place stops',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (tourPlace.directions.length == 0) {
            toast({
                title: 'Tour',
                description: 'Missing tour place directions',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            const request: CreateTourGuideRequest = {
                name: tourPlace.name,
                city: tourPlace.cityId!,
                tourSpots: tourPlace.stops.map(stop => stop.id!) as string[],
                directions: tourPlace.directions,
                video: '',
            };
            await withLoading(saveTourGuide(request));

            toast({
                title: 'Tour',
                description: 'Sucessfully saved tour guide',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (e) {
            toast({
                title: 'Tour',
                description: 'Error saving tour guide',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const onCancel = (): void => router.back();

    if (isLoading) {
        return <LoadingSkeleton/>;
    }

    const initialCoordinates = cities.find(city => city.id == tourPlace.cityId)?.location;

    const onDeleteSpot = async (spotId: string): Promise<void> => {
        try {
            await withLoading(deleteTourSpot(spotId));

            toast({
                title: 'Tour Spot',
                description: 'Successfully deleted spot',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            setTourPlace(prevState => {
                return {
                    ...prevState,
                    stops: prevState.stops.filter(stop => stop.id != spotId),
                };
            });
        } catch (e) {
            toast({
                title: 'Tour',
                description: 'Error deleting spot',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };


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
            <Flex flexDirection="column" gap={4}>
                <TourStopTable stops={tourPlace.stops} onDeleteSpotClick={onDeleteSpot}/>
                <EditTourStopModal onSave={addStop} city={cities.find(city => city.id == tourPlace.cityId)}/>
                <EditDirectionsModal onSave={addDirections} place={tourPlace} initialCoordinates={initialCoordinates}/>
            </Flex>
            <Footer tourPlace={tourPlace} onSave={onSave} onCancel={onCancel}/>
        </Flex>
    );
}

type FooterProps = {
    onSave: OnClickHandler;
    onCancel: OnClickHandler;
    tourPlace: TourGuidePlace;
}

const Footer = ({ tourPlace, onSave, onCancel }: FooterProps): ReactElement => (
  <section
    style={{
      position: "fixed",
      borderTop: "1px solid #ededed",
      bottom: 0,
      left: 0,
      width: "100%",
      padding: 16,
      marginTop: 12,
      background: "#f9f9f9",
    }}
  >
    <Flex flexDirection="row-reverse" gap={8}>
      <Button isDisabled={isSaveDisabled(tourPlace)} type="submit" background={BRAND_COLOR} onClick={onSave}>
        Save
      </Button>
      <Button type="button" onClick={onCancel}>
        Back
      </Button>
    </Flex>
  </section>
)

const isSaveDisabled = (place: TourGuidePlace): boolean => {
  return !place?.cityId || place.name.trim().length < 3 || place.stops.length == 0 || place.directions.length == 0
}