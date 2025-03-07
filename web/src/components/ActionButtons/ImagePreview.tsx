import { Image } from '@chakra-ui/react'

type Props = {
    image: string
    alt: string
}

export const ImagePreview = ({ alt, image }: Props) => (
    <Image
        cursor="pointer"
        width={50}
        height={50}
        alt={alt}
        src={image}
        onClick={() => window.open(image, '_blank')}
    />
)
