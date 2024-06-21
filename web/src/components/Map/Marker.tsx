import { Nullable } from '@guide-me-app/core';
import { Marker as MapMarker } from '@react-google-maps/api';
import { ReactElement } from 'react';

'@react-google-maps/api';

type Props = {
    locations?: google.maps.LatLngLiteral[];
}

export const Marker = ({ locations }: Props): Nullable<ReactElement> => {
    if (!locations || locations.length == 0) {
        return null;
    }

    return (
        <>
            {locations.map((location => (
                <MapMarker key={buildKey(location)} position={location}/>
            )))}
        </>
    );
};

const buildKey = (location: google.maps.LatLngLiteral): string => {
    return `${location.lat}-${location.lng}`;
}
