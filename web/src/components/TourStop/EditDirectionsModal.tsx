import { TourGuidePlace } from "@/app/tour/add/page"
import { Map } from "@/components/Map"
import { CoordinateMapper } from "@/utils/mapppers"
import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import { Coordinates, OnValueChangeHandler } from "@guide-me-app/core"
import { ReactElement, useState } from "react"

type Props = {
  onSave: OnValueChangeHandler<Coordinates[]>
  place: TourGuidePlace
  initialCoordinates?: Coordinates
}

export const EditDirectionsModal = ({ onSave, place, initialCoordinates }: Props): ReactElement => {
  const [directions, setDirections] = useState<Coordinates[]>(() => place.directions)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const { stops } = place

  const handleSave = async (): Promise<void> => {
    if (directions.length == 0) {
      toast({
        title: "Tour Stop directions",
        description: "No directions defined",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    onSave(directions)
    onClose()
  }

  const stopsCoordinates = stops.map((spot) => spot.coordinate!)

  const addDirection = (coordinate: google.maps.LatLngLiteral): void => {
    setDirections((prevState) => {
      return [...prevState, { longitude: coordinate.lng, latitude: coordinate.lat }]
    })
  }

  const undoLast = (): void => {
    setDirections((prevState) => {
      return prevState.slice(0, prevState.length - 1)
    })
  }

  const undoAll = (): void => {
    setDirections([])
  }

  const initialCenter = initialCoordinates ? CoordinateMapper.fromCoordinateToGoogle(initialCoordinates) : undefined

  return (
    <>
      <Button isDisabled={stops.length == 0} onClick={onOpen}>
        Add Directions
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent minW={600}>
          <ModalHeader>Add new Tour guide directions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div style={{ height: "400px" }}>
              <Map
                zoom={12}
                initialCenter={initialCenter}
                onDoubleClick={addDirection}
                polylines={CoordinateMapper.fromCoordinatesToGoogle(directions)}
                markers={CoordinateMapper.fromGoogleToMarkerInfos(stopsCoordinates)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Flex flex={1} justifyContent="space-between">
              <Flex gap={4}>
                <Button isDisabled={!directions.length} colorScheme="orange" onClick={undoLast}>
                  Undo
                </Button>
                <Button isDisabled={!directions.length} colorScheme="red" onClick={undoAll}>
                  Undo All
                </Button>
              </Flex>
              <Flex gap={4}>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  Close
                </Button>
                <Button colorScheme="blue" onClick={handleSave}>
                  Save
                </Button>
              </Flex>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
