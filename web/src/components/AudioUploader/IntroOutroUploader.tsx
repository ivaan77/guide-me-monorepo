import { FormControl, FormLabel } from '@chakra-ui/react'
import { FileInput } from '@/components/FileUpload'
import { UploadResponse } from '@/app/api/upload/route'
import { OnValueChangeHandler } from '@guide-me-app/core'

type Props = {
    disabled: boolean
    folder: string
    onUploadIntro: OnValueChangeHandler<UploadResponse[]>
    onUploadOutro: OnValueChangeHandler<UploadResponse[]>
}

export const IntroOutroUploader = ({ disabled, folder, onUploadOutro, onUploadIntro }: Props) => (
    <>
        <FormControl>
            <FormLabel>Intro Audio</FormLabel>
            <FileInput
                disabled={disabled}
                accept={'audio/*'}
                multiple={false}
                folder={`${folder}/intro/`}
                onUpload={onUploadIntro}
            />
        </FormControl>
        <FormControl>
            <FormLabel>Outro Audio</FormLabel>
            <FileInput
                disabled={disabled}
                accept={'audio/*'}
                multiple={false}
                folder={`${folder}/outro/`}
                onUpload={onUploadOutro}
            />
        </FormControl>
    </>
)
