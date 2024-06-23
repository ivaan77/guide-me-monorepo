'use client';
import { getAllCities, saveCity } from '@/utils/api';
import { Button, Input, Table, TableCaption, TableContainer, Tbody, Td, Tfoot, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { AllCityResponse, City } from '@guide-me-app/core';
import { useEffect, useState } from 'react';

export default function City() {
    const [cities, setCities] = useState<City[]>([]);
    const [cityName, setCityName] = useState<string>('');

    const toast = useToast();

    useEffect(() => {
        fetchAllCities();
    }, []);

    const fetchAllCities = async () => {
        try {
            const {data} = await getAllCities<AllCityResponse>();
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

    const handleCityNameChanged = (cityName: string) => {
        setCityName(cityName);
    };

    const handleCitySave = async () => {
        await saveCity({ name: cityName });
    };

    return (
        <section>
            <TableContainer>
                <Table variant="simple">
                    <TableCaption>Imperial to metric conversion factors</TableCaption>
                    <Thead>
                        <Tr>
                            <Th>To convert</Th>
                            <Th>into</Th>
                            <Th isNumeric>multiply by</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        <Tr>
                            <Td>inches</Td>
                            <Td>millimetres (mm)</Td>
                            <Td isNumeric>25.4</Td>
                        </Tr>
                        <Tr>
                            <Td>feet</Td>
                            <Td>centimetres (cm)</Td>
                            <Td isNumeric>30.48</Td>
                        </Tr>
                        <Tr>
                            <Td>yards</Td>
                            <Td>metres (m)</Td>
                            <Td isNumeric>0.91444</Td>
                        </Tr>
                        <Tr>
                            <Td>Citis</Td>
                            <Td>length</Td>
                            <Td isNumeric>{cities?.length || 0}</Td>
                        </Tr>
                    </Tbody>
                    <Tfoot>
                        <Tr>
                            <Th>To convert</Th>
                            <Th>into</Th>
                            <Th isNumeric>multiply by</Th>
                        </Tr>
                    </Tfoot>
                </Table>
            </TableContainer>

            <Input
                type="text"
                value={cityName}
                onChange={e => handleCityNameChanged(e.target.value)}/>

            <Button disabled={cityName.length < 3} onClick={handleCitySave}>Save</Button>
        </section>
    );
}
