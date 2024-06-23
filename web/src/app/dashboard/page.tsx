'use client';

import { useState } from 'react';

import { Map } from '@/components/Map';

export default function Dashboard() {
    //const [tourStops, setTourStops] = useState<google.maps.LatLngLiteral[]>([]);
    const [navigationDirections, setNavigationDirections] = useState<google.maps.LatLngLiteral[]>([]);

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
