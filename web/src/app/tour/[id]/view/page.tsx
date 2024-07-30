'use client';

import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton';
import { useLoading } from '@/components/Loading/useLoading';
import { Map } from '@/components/Map';
import { getTourGuide } from '@/utils/api';
import { CoordinateMapper } from '@/utils/mapppers';
import { useToast } from '@chakra-ui/react';
import { Nullable, TourGuideResponse } from '@guide-me-app/core';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Params = {
    id: string;
}

export default function ViewTourPage() {
    const [tourGuide, setTourGuide] = useState<Nullable<TourGuideResponse>>(null);
    const { isLoading, withLoading } = useLoading();
    const toast = useToast();
    const { id } = useParams<Params>();

    useEffect(() => {
        fetchTourGuide();
    }, []);

    const fetchTourGuide = async (): Promise<void> => {
        try {
            const { data } = await withLoading(getTourGuide(id));
            setTourGuide(data);
        } catch (e) {
            toast({
                title: 'Tour Guide',
                description: 'Failed loading tour guide',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    if (isLoading) {
        return <LoadingSkeleton/>;
    }

    if (!isLoading && !tourGuide) {
        return <section>No guide</section>;
    }

    const directions = tourGuide?.directions.map(direction => CoordinateMapper.fromCoordinateToGoogle(direction))!;
    const markers = tourGuide?.tourSpots.map(tourSpot => CoordinateMapper.fromCoordinateToMarkerInfo(tourSpot.location, { title: tourSpot.name }))!;

    return (
        <section style={{ padding: 16 }}>
            <div style={{ width: '100%', height: 500 }}>
                <Map zoom={12} polylines={directions} markers={markers}/>
            </div>
        </section>
    );
}