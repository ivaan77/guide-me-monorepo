import { Link } from '@chakra-ui/react'

type Props = {
    audio: string
}

export const ListenSoundLink = ({ audio }: Props) => (
    <Link color="blue" cursor="pointer" onClick={() => window.open(audio, '_blank')}>
        Listen
    </Link>
)
