'use client';

import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton';
import { useLoading } from '@/components/Loading/useLoading';
import { Map } from '@/components/Map';
import { getTourGuide } from '@/utils/api';
import { CoordinateMapper } from '@/utils/mapppers';
import { Button, Divider, Flex, Heading, Image, Table, TableCaption, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { Nullable, OnClickHandler, TourGuideResponse } from '@guide-me-app/core';
import { useParams, useRouter } from 'next/navigation';
import { ReactElement, useEffect, useState } from 'react';

type Params = {
    id: string;
}

export default function ViewTourPage() {
    const [tourGuide, setTourGuide] = useState<Nullable<TourGuideResponse>>(null);
    const { isLoading, withLoading } = useLoading();
    const toast = useToast();
    const { id } = useParams<Params>();
    const router = useRouter();

    useEffect(() => {
        fetchTourGuide();
    }, []);

    const fetchTourGuide = async (): Promise<void> => {
        try {
            const { data } = await withLoading(getTourGuide(id));
            setTourGuide(data);
        } catch (e) {
            toast({
                title: 'Tour Guide',
                description: 'Failed loading tour guide',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const onBack = (): void => router.back();

    if (isLoading) {
        return <LoadingSkeleton/>;
    }

    if (!isLoading && !tourGuide) {
        return <section>No guide</section>;
    }

    const directions = tourGuide?.directions.map(direction => CoordinateMapper.fromCoordinateToGoogle(direction))!;
    const markers = tourGuide?.tourSpots.map(tourSpot => CoordinateMapper.fromCoordinateToMarkerInfo(tourSpot.location, { title: tourSpot.name }))!;

    return (
        <>
            <section style={{ padding: 16 }}>
                <Flex display="column" gap={16}>
                    <Heading as="h4" size="md" mb={8}>
                        {tourGuide?.name}
                    </Heading>
                    <Divider mb={4} mt={4}/>
                    <Text>Tour guide id: {tourGuide?.id}</Text>
                    <Divider mb={4} mt={4}/>
                    <Text>City: {tourGuide?.city.name}</Text>
                    <Divider mb={4} mt={4}/>
                    <Heading as="h4" size="md" mb={8}>
                        Tour guide stops
                    </Heading>
                    <TableContainer>
                        <Table variant="simple">
                            <TableCaption>Tour guide stops</TableCaption>
                            <Thead>
                                <Tr>
                                    <Th>Id</Th>
                                    <Th>Name</Th>
                                    <Th>Images</Th>
                                    <Th>Audio</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {tourGuide?.tourSpots.map(stop => (
                                    <Tr key={stop.id}>
                                        <Td>{stop.id}</Td>
                                        <Td>{stop.name}</Td>
                                        <Td>
                                            <Flex gap={2}>
                                                {stop.images.map((image, index) => {
                                                    return (
                                                        <Image
                                                            key={image}
                                                            boxSize="40px"
                                                            objectFit="cover"
                                                            src={image}
                                                            alt={`image_${index + 1}`}
                                                        />);
                                                })}
                                            </Flex>
                                        </Td>
                                        <Td>{stop.audio}</Td>
                                        <Td></Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                    <Divider mb={4} mt={4}/>
                </Flex>
                <Heading as="h4" size="md" mb={8}>
                    Tour guide on map
                </Heading>
                <div style={{ width: '100%', height: 500, marginBottom:72 }}>
                    <Map initialCenter={CoordinateMapper.fromCoordinateToGoogle(tourGuide?.tourSpots[0].location!)} zoom={12} polylines={directions}
                         markers={markers}/>
                </div>
            </section>
            <Footer onBack={onBack}/>
        </>
    );
}

type FooterProps = {
    onBack: OnClickHandler;
}

const Footer = ({ onBack }: FooterProps): ReactElement => (
    <section style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: 16, marginTop:12, background: '#F7FAFC' }}>
        <Flex flexDirection="row-reverse" gap={8}>
            <Button type="button" onClick={onBack}>Back</Button>
        </Flex>
    </section>
);