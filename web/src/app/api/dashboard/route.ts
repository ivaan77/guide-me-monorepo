import axios from 'axios';
import { NextResponse } from 'next/server';

type Params = {
    team: string
}

export async function GET(request: Request, context: { params: Params }): Promise<NextResponse<Params>> {
    console.log(request);

    const {data} = await axios.get<string>('http://localhost:3001');
    return NextResponse.json({team: data});
}