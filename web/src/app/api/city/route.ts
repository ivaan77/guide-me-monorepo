import { restClient } from '@/utils/server/restClient'
import { NextRequest, NextResponse } from 'next/server'
import { AdminPath, AllCityResponse, CityByIdResponse, SaveCityRequest } from '@guide-me-app/core'

export async function GET(): Promise<Response> {
    try {
        const { data } = await restClient.get<AllCityResponse>(AdminPath.City.getAll)
        return NextResponse.json(data)
    } catch (e) {
        console.log(e)
        return new Promise(NextResponse.error)
    }
}

export async function POST(request: NextRequest):  Promise<Response> {
    try {
        const body = (await request.json()) as SaveCityRequest
        const { data } = await restClient.post<CityByIdResponse>(AdminPath.City.save, body)
        return NextResponse.json(data)
    } catch (e) {
        console.log(e)
        return new Promise(NextResponse.error)
    }
}
