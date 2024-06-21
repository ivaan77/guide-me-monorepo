'use client';

import { dummReq } from '@/utils/api';
import { useEffect, useState } from 'react';

import { Map } from '@/components/Map';

export default async function Dashboard() {
    const [tourStops, setTourStops] = useState<google.maps.LatLngLiteral[]>([]);
    const [navigationDirections, setNavigationDirections] = useState<google.maps.LatLngLiteral[]>([]);

    useEffect(() => {
        dummReq();
    }, []);


    const handleDoubleClick = (latLng: google.maps.LatLngLiteral): void => {
        setNavigationDirections(prevState => {
            return [
                ...prevState,
                latLng
            ];
        });
    };

    return (
        <section>
            <header>Dashboard</header>
            <main>
                <div style={{ width: '80%', height: '600px' }}>
                    <Map onDoubleClick={handleDoubleClick} polylinePositions={navigationDirections}/>
                </div>
            </main>
        </section>
    );
}
