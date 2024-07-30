import { Marker, MarkerInfo } from '@/components/Map/Marker';
import { Polyline } from '@/components/Map/Polyline';
import { Nullable, OnValueChangeHandler} from '@guide-me-app/core';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { ReactElement, useCallback, useState } from 'react';

type Props = {
    markers?: MarkerInfo[];
    polylines?: google.maps.LatLngLiteral[];
    onDoubleClick?: OnValueChangeHandler<google.maps.LatLngLiteral>;
    onMarkerClick?: OnValueChangeHandler<string>;
    zoom?: number;
}

const ZOOM_LEVEL = 10;

export const Map = ({ markers, polylines, onDoubleClick, zoom, onMarkerClick }: Props): Nullable<ReactElement> => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: 'AIzaSyAiQ8YI-iQfstg5lyzJgPRo88Zqojja89E'
    });

    const [, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    const handleDoubleClick = (event: google.maps.MapMouseEvent): void => {
        if (event.latLng) {
            const { lat, lng } = event.latLng;
            const latitude = lat();
            const longitude = lng();

            onDoubleClick?.({ lat: latitude, lng: longitude });
        }
    };

    if (!isLoaded) {
        return null;
    }

    return (
        <GoogleMap
            zoom={zoom || ZOOM_LEVEL}
            options={{
                disableDoubleClickZoom: true
            }}
            mapContainerStyle={containerStyle}
            center={center}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onDblClick={handleDoubleClick}>
            <Polyline path={polylines}/>
            <Marker markers={markers} onClick={onMarkerClick} />
        </GoogleMap>
    );
};

const containerStyle = {
    width: '100%',
    height: '100%',
};

const center = {
    lat: 45.815399,
    lng: 15.966568,
};
