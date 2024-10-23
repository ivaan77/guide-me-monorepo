import { ReactElement } from 'react';
import { Polyline as PolylineView } from '@react-google-maps/api';
import { BRAND_COLOR, Nullable } from '@guide-me-app/core';

type Props = {
    path?: google.maps.LatLngLiteral[];
}

export const Polyline = ({ path }: Props): Nullable<ReactElement> => {
    if (!path || path.length < 1) {
        return null;
    }


    return <PolylineView path={path} options={{ strokeColor: BRAND_COLOR }}/>
};
