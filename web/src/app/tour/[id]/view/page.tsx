'use client'

import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton'
import { Map } from '@/components/Map'
import { CoordinateMapper, TourMapper } from '@/utils/mapppers'
import { Button, Divider, Flex, Heading, Text } from '@chakra-ui/react'
import { OnClickHandler } from '@guide-me-app/core'
import { ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { useLoading } from '@/components/Loading/useLoading'
import { useExistingTour } from '@/hooks/tour/useExistingTour'
import { TourStopTable } from '@/components/TourStop/TourStopTable'
import { useCities } from '@/hooks/city/useCities'
import { ListenSoundLink } from '@/components/ActionButtons/ListenSoundLink'
import { CloseIcon } from '@chakra-ui/icons'

export default function ViewTourPage() {
    const router = useRouter()
    const { isLoading } = useLoading()
    const { tourGuide } = useExistingTour()
    const { cities } = useCities()

    const onBack = (): void => router.back()

    if (isLoading || !tourGuide || !cities) {
        return <LoadingSkeleton />
    }

    if (!isLoading && !tourGuide && !cities) {
        return <section>No guide</section>
    }

    const directions = tourGuide?.directions.map((direction) =>
        CoordinateMapper.fromCoordinateToGoogle(direction),
    )
    const markers = tourGuide?.tourSpots.map((tourSpot) =>
        CoordinateMapper.fromCoordinateToMarkerInfo(tourSpot.location, { title: tourSpot.name }),
    )

    return (
        <>
            <section style={{ padding: 16 }}>
                <Flex display="column" gap={16}>
                    <Heading as="h4" size="md" mb={8}>
                        {tourGuide?.name}
                    </Heading>
                    <Divider mb={4} mt={4} />
                    <Text>Tour guide id: {tourGuide?.id}</Text>
                    <Divider mb={4} mt={4} />
                    <Text>City: {tourGuide?.city.name}</Text>
                    <Divider mb={4} mt={4} />
                    <Flex flexDirection="row" gap={2}>
                        <Text>Intro</Text>
                        {tourGuide.introAudio ? (
                            <ListenSoundLink audio={tourGuide.introAudio} />
                        ) : (
                            <CloseIcon w={4} h={4} color="red.500" />
                        )}
                    </Flex>
                    <Divider mb={4} mt={4} />
                    <Flex flexDirection="row" gap={2}>
                        <Text>Outro</Text>
                        {tourGuide.outroAudio ? (
                            <ListenSoundLink audio={tourGuide.outroAudio} />
                        ) : (
                            <CloseIcon w={4} h={4} color="red.500" />
                        )}
                    </Flex>
                    <Divider mb={4} mt={4} />
                    <Heading as="h4" size="md" mb={8}>
                        Tour guide stops
                    </Heading>
                    <TourStopTable
                        tourPlace={TourMapper.fromTourGuideResponseToTourPlace(tourGuide)}
                        cities={cities}
                    />
                    <Divider mb={4} mt={4} />
                </Flex>
                <Heading as="h4" size="md" mb={8}>
                    Tour guide on map
                </Heading>
                <div
                    style={{
                        maxWidth: '1300px',
                        width: '100%',
                        height: 500,
                        marginBottom: 72,
                        alignItems: 'center',
                    }}
                >
                    <Map
                        initialCenter={CoordinateMapper.fromCoordinateToGoogle(
                            tourGuide?.tourSpots[0].location!,
                        )}
                        zoom={12}
                        polylines={directions}
                        markers={markers}
                    />
                </div>
            </section>
            <Footer onBack={onBack} />
        </>
    )
}

type FooterProps = {
    onBack: OnClickHandler
}

const Footer = ({ onBack }: FooterProps): ReactElement => (
    <section
        style={{
            position: 'fixed',
            borderTop: '1px solid #ededed',
            bottom: 0,
            left: 0,
            width: '100%',
            padding: 16,
            marginTop: 12,
            background: '#f9f9f9',
        }}
    >
        <Flex flexDirection="row-reverse" gap={8}>
            <Button type="button" onClick={onBack}>
                Back
            </Button>
        </Flex>
    </section>
)
