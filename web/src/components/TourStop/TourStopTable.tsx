import { TourGuideStop } from '@/app/tour/add/page';
import { ViewMapModal } from '@/components/TourStop/ViewMapModal';
import { DeleteIcon } from '@chakra-ui/icons';
import { Button, FormLabel, Table, TableCaption, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr } from '@chakra-ui/react';
import { Nullable, OnValueChangeHandler } from '@guide-me-app/core';
import { ReactElement, useState } from 'react';

type Props = {
    stops: TourGuideStop[];
    onDeleteSpotClick: OnValueChangeHandler<string>;
}

export const TourStopTable = ({ stops, onDeleteSpotClick }: Props): ReactElement => {
    const [displayMapModal, setDisplayMapModal] = useState<boolean>(false);
    const [coordinates, setCoordinates] = useState<google.maps.LatLngLiteral[]>([]);

    const handleDisplayModal = (coordinate: Nullable<google.maps.LatLngLiteral>): void => {
        if (!coordinate) {
            return;
        }

        setCoordinates(Array.of(coordinate));
        setDisplayMapModal(true);
    };

    return (
        <>
            <FormLabel>Tour stops</FormLabel>
            {stops.length == 0 ? (<Text fontSize="md">No stops</Text>) : (
                <TableContainer>
                    <Table variant="simple">
                        <TableCaption>Tour guide stops</TableCaption>
                        <Thead>
                            <Tr>
                                <Th>Id</Th>
                                <Th>Name</Th>
                                <Th>Coordinates</Th>
                                <Th>Images</Th>
                                <Th>Audio</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {stops.map(stop => (
                                <Tr key={stop.id}>
                                    <Td>{stop.id}</Td>
                                    <Td>{stop.name}</Td>
                                    <Td>
                                        <Button onClick={() => handleDisplayModal(stop.coordinate)}>View on Map</Button>
                                    </Td>
                                    <Td>{stop.images.length} image{stop.images.length > 1 ? 's' : ''}</Td>
                                    <Td>{stop.audio.length} audio{stop.audio.length > 1 ? 's' : ''}</Td>
                                    <Td>
                                        <Tooltip hasArrow fontSize="md" label="Delete spot">
                                            <DeleteIcon w={4} h={4} color="red.500" onClick={() => onDeleteSpotClick(stop.id!)}/>
                                        </Tooltip>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            )}
            <ViewMapModal coordinates={coordinates} isOpen={displayMapModal} onClose={() => setDisplayMapModal(false)}/>
        </>
    );
};
