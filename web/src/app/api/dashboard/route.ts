import axios from 'axios';
import { NextResponse } from 'next/server';
import { API_URL } from '@/utils/config';

type Params = {
    team: string
}

export async function GET(request: Request, context: { params: Params }): Promise<NextResponse<Params>> {
    try {
        const {data} = await axios.get<string>(API_URL);
    } catch (e) {
        console.log("Errrrr");
        console.log(e);
        console.log("Errrrr");
    }

    return NextResponse.json({team: 'data'});
}
