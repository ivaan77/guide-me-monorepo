import { UploadResponse } from '@/app/api/upload/route'
import { uploadFile } from '@/utils/api'
import { useToast } from '@chakra-ui/react'
import { OnValueChangeHandler } from '@guide-me-app/core'
import { ChangeEvent, ReactElement } from 'react'

type Props = {
    multiple: boolean
    accept: string
    onUpload: OnValueChangeHandler<UploadResponse[]>
    folder?: string
    disabled?: boolean
}

export const FileInput = ({
    accept,
    onUpload,
    multiple,
    folder,
    disabled,
}: Props): ReactElement => {
    const toast = useToast()
    const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const fileList = event.target.files

        if (!fileList) {
            return
        }

        const files = Object.values(fileList)
        try {
            if (files.length > 0) {
                const uploads = await Promise.all(files.map((file) => uploadFile(file, folder)))
                const allUploads = uploads.map((upload) => upload.data)
                onUpload(allUploads)
            }
        } catch (e) {
            toast({
                title: 'Upload',
                description: 'Upload failed',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    return (
        <span>
            <input
                disabled={disabled}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={handleUploadFile}
            />
        </span>
    )
}
