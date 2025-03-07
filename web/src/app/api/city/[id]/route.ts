import { restClient } from '@/utils/server/restClient'
import { NextResponse } from 'next/server'
import { AdminPath, CityByIdResponse } from '@guide-me-app/core'

type Params = {
    id: string
}

export async function GET(request: Request, context: { params: Params }): Promise<Response> {
    const { id } = context.params

    try {
        const { data } = await restClient.get<CityByIdResponse>(AdminPath.City.getCityById(id))
        return NextResponse.json(data)
    } catch (e) {
        console.log(e)
        return new Promise(NextResponse.error)
    }
}
