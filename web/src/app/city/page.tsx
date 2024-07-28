'use client';

import { LoadingSkeleton } from '@/components/Loading/LoadingSkeleton';
import { useLoading } from '@/components/Loading/useLoading';
import { getAllCities, saveCity } from '@/utils/api';
import { CheckIcon } from '@chakra-ui/icons';
import { Box, Button, Input, Table, TableCaption, TableContainer, Tbody, Td, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { AllCityResponse, City } from '@guide-me-app/core';
import { useEffect, useState } from 'react';

export default function CityPage() {
    const [cities, setCities] = useState<City[]>([]);
    const [cityName, setCityName] = useState<string>('');

    const { isLoading, withLoading } = useLoading();
    const toast = useToast();

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

    const handleCityNameChanged = (cityName: string): void => {
        setCityName(cityName);
    };

    const handleCitySave = async (): Promise<void> => {
        try {
            await withLoading(saveCity({ name: cityName }));
            await fetchAllCities();
            toast({
                title: 'City',
                description: 'City saved',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (e) {
            toast({
                title: 'City',
                description: 'Error saving city',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    if (isLoading) {
        return <LoadingSkeleton/>;
    }

    return (
        <Box display="flex" flexDirection="column" width="90%" alignItems="center" justifyContent="space-around" flex={1}>
            <h3>Cities</h3>
            <Box display="flex" gap={8} flexDirection="row" alignItems="center">
                <Input
                    type="text"
                    value={cityName}
                    onChange={e => handleCityNameChanged(e.target.value)}/>
                <Button isDisabled={cityName.length < 3} onClick={handleCitySave}>Save</Button>
            </Box>
            <TableContainer>
                <Table variant="simple">
                    <TableCaption>Tour guide cities</TableCaption>
                    <Thead>
                        <Tr>
                            <Th>Id</Th>
                            <Th>Name</Th>
                            <Th>Is active</Th>
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
                                <Td></Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
        </Box>
    );
}
