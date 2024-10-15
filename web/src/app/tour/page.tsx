'use client';

import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton';
import { useLoading } from '@/components/Loading/useLoading';
import { getAllTourGuides } from '@/utils/api';
import { EditIcon, ViewIcon } from '@chakra-ui/icons';
import { Button, Center, Container, Flex, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr, useToast } from '@chakra-ui/react';
import { BRAND_COLOR, OnValueChangeHandler, TourGuideResponse } from '@guide-me-app/core';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactElement, useEffect, useState } from 'react';

export default function AllToursPage() {
    const [tourGuides, setTourGuides] = useState<TourGuideResponse[]>([]);
    const { isLoading, withLoading } = useLoading();
    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        fetchAllTourGuides();
    }, []);

    const fetchAllTourGuides = async (): Promise<void> => {
        try {
            const { data } = await withLoading(getAllTourGuides());
            setTourGuides(data);
        } catch (e) {
            toast({
                title: 'Tour Guides',
                description: 'Failed fetching tour guides',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    if (isLoading) {
        return <LoadingSkeleton/>;
    }

    const onEditClick = (tourGuideId: string): void => router.push(`/tour/${tourGuideId}/edit`);
    const onViewClick = (tourGuideId: string): void => router.push(`/tour/${tourGuideId}/view`);

    return (
        <section>
            <Center padding={8}>
                <Text>GuideMe Tours</Text>
            </Center>
            <Flex flex={1} flexDirection="row-reverse" paddingLeft={8} paddingRight={8}>
                <Button mb={8} background={BRAND_COLOR}>
                    <Link href={'/tour/add'}>Add new tour</Link>
                </Button>
            </Flex>
            <TourGuidesTable tourGuides={tourGuides} onEditClick={onEditClick} onViewClick={onViewClick}/>
        </section>
    );
}

type TableProps = {
    tourGuides: TourGuideResponse[];
    onEditClick: OnValueChangeHandler<string>;
    onViewClick: OnValueChangeHandler<string>;
}

const TourGuidesTable = ({ tourGuides, onEditClick, onViewClick }: TableProps): ReactElement => {
    if (tourGuides.length == 0) {
        return (
            <Container padding={8}>
                <Center>
                    <Text>No tours in database</Text>
                </Center>
                <Center>
                    <Text>When you add tour it will be displayed here</Text>
                </Center>
            </Container>
        );
    }

    return (
        <TableContainer>
            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th>Id</Th>
                        <Th>Name</Th>
                        <Th>City Name</Th>
                        <Th>Spots count</Th>
                        <Th>Directions count</Th>
                        <Th>Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {tourGuides.map(tourGuide => (
                        <Tr key={tourGuide.id}>
                            <Td>{tourGuide.id}</Td>
                            <Td>{tourGuide.name}</Td>
                            <Td>{tourGuide.city.name}</Td>
                            <Td>{tourGuide.tourSpots.length}</Td>
                            <Td>{tourGuide.directions.length}</Td>
                            <Td>
                                <Flex gap={2}>
                                    <Tooltip hasArrow fontSize="md" label="Edit tour guide">
                                        <EditIcon w={4} h={4} color="green.500" onClick={() => onEditClick(tourGuide.id)}/>
                                    </Tooltip>
                                    <Tooltip hasArrow fontSize="md" label="View tour guide details">
                                        <ViewIcon w={4} h={4} color="green.500" onClick={() => onViewClick(tourGuide.id)}/>
                                    </Tooltip>
                                </Flex>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};