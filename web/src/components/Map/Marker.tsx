import { Nullable, OnValueChangeHandler } from '@guide-me-app/core';
import { Marker as MapMarker } from '@react-google-maps/api';
import { ReactElement } from 'react';

export type MarkerInfo = {
    id?: string;
    location: google.maps.LatLngLiteral;
    title?: string;
}

type Props = {
    markers?: MarkerInfo[];
    onClick?: OnValueChangeHandler<string>;
}

export const Marker = ({ markers, onClick }: Props): Nullable<ReactElement> => {
    if (!markers || markers.length == 0) {
        return null;
    }

    return (
        <>
            {markers.map((marker => {
                const key = marker.id || buildKey(marker.location);
                return(
                    <MapMarker onClick={() => onClick?.(key)} title={marker.title || ''} key={key} position={marker.location}/>
                )
            }))}
        </>
    );
};

const buildKey = (location: google.maps.LatLngLiteral): string => {
    return `${location.lat}-${location.lng}`;
}
