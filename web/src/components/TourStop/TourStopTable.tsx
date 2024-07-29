import { TourGuideStop } from '@/app/tour/add/page';
import { FormLabel, Table, TableCaption, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { ReactElement } from 'react';

type Props = {
    stops: TourGuideStop[]
}

export const TourStopTable = ({stops}: Props): ReactElement => (
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
                            <Th>Images</Th>
                            <Th>Audio</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {stops.map(stop => (
                            <Tr key={stop.id}>
                                <Td>{stop.id}</Td>
                                <Td>{stop.name}</Td>
                                <Td>{stop.images.length} image{stop.images.length > 1 ? 's' : ''}</Td>
                                <Td>{stop.audio.length} audio{stop.audio.length > 1 ? 's' : ''}</Td>
                                <Td></Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
        )}
    </>
);
