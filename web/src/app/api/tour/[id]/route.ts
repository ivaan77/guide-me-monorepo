import { restClient } from '@/utils/server/restClient'
import { NextResponse } from 'next/server'
import { AdminPath, EditTourGuideRequest, TourGuideResponse } from '@guide-me-app/core'

type Params = {
    id: string
}

export async function GET(request: Request, context: { params: Params }): Promise<Response> {
    const { id } = context.params

    try {
        const { data } = await restClient.get<TourGuideResponse>(AdminPath.Tour.getTourById(id))
        return NextResponse.json(data)
    } catch (e) {
        console.log(e)
        return new Promise(NextResponse.error)
    }
}

export async function PUT(request: Request, context: { params: Params }): Promise<Response> {
    const { id } = context.params

    try {
        const body = (await request.json()) as EditTourGuideRequest
        const { data } = await restClient.put<TourGuideResponse>(
            AdminPath.Tour.editTourById(id),
            body,
        )
        return NextResponse.json(data)
    } catch (e) {
        console.log(e)
        return new Promise(NextResponse.error)
    }
}
