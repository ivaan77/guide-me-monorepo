type Params = {
    team: string
}

export async function GET(request: Request, context: { params: Params }): Promise<Params> {
    console.log(request);
    return { team: 's' };
}