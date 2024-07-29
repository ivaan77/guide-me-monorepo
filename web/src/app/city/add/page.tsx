'use client';

import { saveCity } from '@/utils/api';
import { Box, Button, Center, Flex, Input, useToast } from '@chakra-ui/react';
import { BRAND_COLOR } from '@guide-me-app/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddCityPage() {
    const [cityName, setCityName] = useState<string>('');
    const toast = useToast();
    const router = useRouter();

    const handleCityNameChanged = (cityName: string): void => {
        setCityName(cityName);
    };

    const handleCitySave = async (): Promise<void> => {
        try {
            await saveCity({ name: cityName });
            toast({
                title: 'City',
                description: 'City saved',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            router.push('/city');
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

    return (
        <Flex flex={1} justifyContent="center" flexDirection="column">
            <Center padding={8}>
                <h3>Add new city</h3>
            </Center>
            <Center>
                <Box display="flex" gap={8} flexDirection="row" alignItems="center">
                    <Input
                        type="text"
                        value={cityName}
                        onChange={e => handleCityNameChanged(e.target.value)}/>
                    <Button background={BRAND_COLOR} isDisabled={cityName.length < 3} onClick={handleCitySave}>Save</Button>
                </Box>
            </Center>
        </Flex>
    );
}
