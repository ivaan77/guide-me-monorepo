import { restClient } from '@/utils/server/restClient';
import { AdminPath, TourGuideResponse } from '@guide-me-app/core';
import { NextResponse } from 'next/server';

export async function GET(): Promise<Response>  {
    try {
        const {data} = await restClient.get<TourGuideResponse[]>(AdminPath.Tour.getAll);
        return NextResponse.json(data);
    } catch (e) {
        console.log(e);
        return new Promise(NextResponse.error);
    }
}
