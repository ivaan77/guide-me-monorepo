import axios from 'axios';
import { NextResponse } from 'next/server';
import { API_URL } from '@/utils/config';
import { AdminPath, AllCityResponse,  } from '@guide-me-app/core';

type Params = {
    team: string
}

const restClient = axios.create({ baseURL: API_URL});

export async function GET(request: Request, context: { params: Params }): Promise<NextResponse<Params>> {
    console.log(request, context);
    try {
        const {data} = await restClient.get<AllCityResponse>(AdminPath.City.getAll);
        console.log(data);
    } catch (e) {
        console.log("Errrrr");
        console.log(e);
        console.log("Errrrr");
    }

    return NextResponse.json({team: 'data'});
}
