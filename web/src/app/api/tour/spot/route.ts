import { restClient } from '@/utils/server/restClient';
import { AdminPath, CreateTourSpotRequest, TourSpotResponse } from '@guide-me-app/core';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse<TourSpotResponse>> {
    try {
        const body = await request.json() as CreateTourSpotRequest;
        const {data} = await restClient.post<TourSpotResponse>(AdminPath.TourSpot.save, body) as TourSpotResponse;
        return NextResponse.json(data);
    } catch (e) {
        console.log(e);
    }
}
