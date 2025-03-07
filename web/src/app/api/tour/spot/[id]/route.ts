import { restClient } from '@/utils/server/restClient'
import { AdminPath, EditTourSpotRequest } from '@guide-me-app/core'
import { NextResponse } from 'next/server'

type Params = {
    id: string
}

export async function DELETE(request: Request, context: { params: Params }) {
    const { id } = context.params
    try {
        await restClient.delete(AdminPath.TourSpot.deleteSpotById(id))
        return NextResponse.json({ id })
    } catch (e) {
        console.log('Failed deleting', e)
        return new Promise(NextResponse.error)
    }
}

export async function PUT(request: Request, context: { params: Params }) {
    const { id } = context.params

    try {
        const body = (await request.json()) as EditTourSpotRequest
        const { data } = await restClient.put(AdminPath.TourSpot.editSpotById(id), body)
        return NextResponse.json(data)
    } catch (e) {
        console.log('Failed updating', e)
        return new Promise(NextResponse.error)
    }
}
