import { restClient } from '@/utils/server/restClient';
import { AdminPath } from '@guide-me-app/core';
import { NextResponse } from 'next/server';

type Params = {
    id: string;
}

export async function DELETE(request: Request, context: { params: Params }) {
    const { id } = context.params;
    await restClient.delete(AdminPath.TourSpot.deleteSpotById(id));
    return NextResponse.json({ id });
}