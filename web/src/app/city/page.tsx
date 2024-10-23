'use client';

import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton';
import { useLoading } from '@/components/Loading/useLoading';
import { getAllCities } from '@/utils/api';
import { AddIcon, CheckIcon } from '@chakra-ui/icons';
import { Button, Center, Container, Flex, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr, useToast } from '@chakra-ui/react';
import { BRAND_COLOR, City, OnClickHandler } from '@guide-me-app/core';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactElement, useEffect, useState } from 'react';

export default function CityPage() {
    const [cities, setCities] = useState<City[]>([]);

    const { isLoading, withLoading } = useLoading();
    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        fetchAllCities();
    }, []);

    const fetchAllCities = async (): Promise<void> => {
        try {
            const { data } = await withLoading(getAllCities());
            setCities(data.cities);
        } catch (e) {
            toast({
                title: 'City',
                description: 'Failed loading cities',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const onAddClick = (): void => router.push(`/tour/add`);

    if (isLoading) {
        return <LoadingSkeleton/>;
    }

    return (
        <section>
            <Center padding={8}>
                <Text>GuideMe Cities</Text>
            </Center>
            <Flex flex={1} flexDirection="row-reverse" paddingLeft={8} paddingRight={8}>
                <Button mb={8} background={BRAND_COLOR}>
                    <Link href={'/city/add'}>Add new city</Link>
                </Button>
            </Flex>
            <CitiesTable cities={cities} onAddClick={onAddClick}/>
        </section>
    );
}

type TableProps = {
    cities: City[];
    onAddClick: OnClickHandler;
}

const CitiesTable = ({ cities, onAddClick }: TableProps): ReactElement => {
    if (cities.length == 0) {
        return (
            <Container padding={8}>
                <Center>
                    <Text>No cities in database</Text>
                </Center>
                <Center>
                    <Text>When you add city it will be displayed here</Text>
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
                        <Th>Is active</Th>
                        <Th>Audio</Th>
                        <Th>Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {cities.map(city => (
                        <Tr key={city.id}>
                            <Td>{city.id}</Td>
                            <Td>{city.name}</Td>
                            <Td align="center">
                                <CheckIcon w={4} h={4} color="green.500"/>
                            </Td>
                            <Td>{city.infoAudio ? city.infoAudio : 'No audio'}</Td>
                            <Td>
                                <Tooltip hasArrow fontSize="md" label="Add tour">
                                    <AddIcon w={4} h={4} color="green.500" onClick={onAddClick}/>
                                </Tooltip>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};