import { restClient } from '@/utils/server/restClient';
import { AdminPath, CreateTourGuideRequest, TourGuideResponse } from '@guide-me-app/core';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(): Promise<Response>  {
    try {
        const {data} = await restClient.get<TourGuideResponse[]>(AdminPath.Tour.getAll);
        return NextResponse.json(data);
    } catch (e) {
        console.log(e);
        return new Promise(NextResponse.error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CreateTourGuideRequest;
        const {data} = await restClient.post<TourGuideResponse>(AdminPath.Tour.save, body);
        return NextResponse.json(data);
    } catch (e) {
        console.log(e);
    }
}
