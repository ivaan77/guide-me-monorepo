import { Map } from '@/components/Map'
import { CoordinateMapper } from '@/utils/mapppers'
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalOverlay,
    useDisclosure,
} from '@chakra-ui/react'
import { OnClickHandler } from '@guide-me-app/core'
import { ReactElement } from 'react'

type Props = {
    coordinates: google.maps.LatLngLiteral[]
    renderActivator: (onOpen: OnClickHandler) => ReactElement
}

//TODO: listen to intro/outro music in table
//TODO: test add, view, edit, view scenario
//TODO: leave one simple route, delete everything else
//TODO: setup caching on api
//TODO: check mobile endpoints

export const ViewMapModal = ({ coordinates, renderActivator }: Props): ReactElement => {
    const { isOpen, onOpen, onClose } = useDisclosure()

    return (
        <>
            {renderActivator(onOpen)}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent minWidth={600}>
                    <ModalBody>
                        <div style={{ height: '500px' }}>
                            <Map
                                initialCenter={coordinates[0]}
                                markers={CoordinateMapper.fromGoogleToMarkerInfos(coordinates)}
                                zoom={12}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}
