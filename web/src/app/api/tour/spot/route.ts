import { restClient } from '@/utils/server/restClient'
import { AdminPath, CreateTourSpotRequest, TourSpotResponse } from '@guide-me-app/core'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<Response> {
    try {
        const body = (await request.json()) as CreateTourSpotRequest
        const { data } = await restClient.post<TourSpotResponse>(AdminPath.TourSpot.save, body)
        return NextResponse.json(data)
    } catch (e) {
        console.log(e)
        return new Promise(NextResponse.error)
    }
}

export async function GET(): Promise<Response> {
    try {
        const { data } = await restClient.get(AdminPath.City.getAll)
        return NextResponse.json(data)
    } catch (e) {
        console.log(e)
        return new Promise(NextResponse.error)
    }
}
