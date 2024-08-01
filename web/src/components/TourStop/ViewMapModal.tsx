import { Map } from '@/components/Map';
import { CoordinateMapper } from '@/utils/mapppers';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalOverlay } from '@chakra-ui/react';
import { OnClickHandler } from '@guide-me-app/core';
import { ReactElement } from 'react';

type Props = {
    isOpen: boolean;
    coordinates: google.maps.LatLngLiteral[];
    onClose: OnClickHandler;
}

export const ViewMapModal = ({ isOpen, onClose, coordinates }: Props): ReactElement => (
    <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay/>
        <ModalContent minWidth={600}>
            <ModalBody>
                <div style={{ height: '500px' }}>
                    <Map initialCenter={coordinates[0]} markers={CoordinateMapper.fromGoogleToMarkerInfos(coordinates)} zoom={12} onMarkerClick={console.log}/>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>
                    Close
                </Button>
            </ModalFooter>
        </ModalContent>
    </Modal>
);
