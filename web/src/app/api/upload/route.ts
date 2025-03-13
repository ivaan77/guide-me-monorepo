import { Storage } from '@google-cloud/storage'
import { NextRequest, NextResponse } from 'next/server'

const base64Key = process.env.GOOGLE_CLOUD_SERVICE_KEY;

if (!base64Key) {
    throw new Error("Missing Google cloud service key");
}

const decodedKey = Buffer.from(base64Key, 'base64').toString('utf-8');
const credentials = JSON.parse(decodedKey);

const storage = new Storage({
    credentials,
})

const bucketName = 'guide-me-app'
const GOOGLE_CLOUD_BASE_URL = 'https://storage.googleapis.com/guide-me-app/'

export type UploadResponse = {
    url: string
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderSuffix = formData.get('folder') as string

    if (!file) {
        throw new Error('No file provided')
    }

    if (file.size < 1) {
        throw new Error('File is empty')
    }

    const buffer = await file.arrayBuffer()

    const folder = resolveFolder(file.type) + folderSuffix.replace(' ', '_')
    const name = folder + file.name

    await storage.bucket(bucketName).file(name).save(Buffer.from(buffer))

    return NextResponse.json({
        url: `${GOOGLE_CLOUD_BASE_URL}${folder}${encodeURIComponent(file.name)}`,
    })
}

const resolveFolder = (fileType: string): 'image/' | 'audio/' => {
    if (fileType.startsWith('image/')) {
        return 'image/'
    }

    if (fileType.startsWith('audio/')) {
        return 'audio/'
    }

    throw new Error('Invalid file type')
}
