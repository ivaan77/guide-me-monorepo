"use client"

import { Map } from "@/components/Map"
import { saveCity } from "@/utils/api"
import { CoordinateMapper } from "@/utils/mapppers"
import { Box, Button, Center, Flex, FormLabel, Input, useToast } from "@chakra-ui/react"
import { BRAND_COLOR, SaveCityRequest } from "@guide-me-app/core"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FileInput } from "@/components/FileUpload"
import { UploadResponse } from "@/app/api/upload/route"

const SAVE_CITY_REQUEST: SaveCityRequest = {
  location: { latitude: 0, longitude: 0 },
  name: "",
  infoAudio: null,
}

export default function AddCityPage() {
  const [city, setCity] = useState<SaveCityRequest>(SAVE_CITY_REQUEST)
  const toast = useToast()
  const router = useRouter()

  const handleCityNameChanged = (name: string): void => {
    setCity((prevState) => {
      return {
        ...prevState,
        name,
      }
    })
  }

  const handleCitySave = async (): Promise<void> => {
    if (city.name.trim().length < 3) {
      toast({
        title: "City",
        description: "Missing or invalid city name",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (city.location.longitude == 0 || city.location.latitude == 0) {
      toast({
        title: "City",
        description: "Missing or invalid city location",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await saveCity(city)
      toast({
        title: "City",
        description: "City saved",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      router.push("/city")
    } catch (e) {
      toast({
        title: "City",
        description: "Error saving city",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const onAddMarker = (latlng: google.maps.LatLngLiteral): void => {
    const location = CoordinateMapper.fromGoogleToCoordinate(latlng)

    setCity((prevState) => {
      return {
        ...prevState,
        location,
      }
    })
  }

  const onUploadedInfoAudio = (audio: UploadResponse[]) => {
    setCity((prevState) => {
      return {
        ...prevState,
        infoAudio: audio.length ? audio[0].url : null,
      }
    })
  }

  return (
    <Flex flex={1} gap={4} justifyContent="center" flexDirection="column">
      <Center padding={8}>
        <h3>Add new city</h3>
      </Center>
      <Center>
        <FormLabel>City name</FormLabel>
        <Box display="flex" gap={8} flexDirection="row" alignItems="center">
          <Input type="text" value={city.name} onChange={(e) => handleCityNameChanged(e.target.value)} />
        </Box>
      </Center>
      <Center>
          <FormLabel>Audio</FormLabel>
          <FileInput
            disabled={!city?.name || city.name.length < 3}
            accept={"audio/*"}
            multiple={false}
            folder={`${city?.name}/info/`}
            onUpload={onUploadedInfoAudio}
          />
      </Center>
      <Center>
        <div style={{ height: "500px", width: "600px" }}>
          <Map
            zoom={6}
            onDoubleClick={onAddMarker}
            markers={
              city.location.latitude != 0 && city.location.longitude != 0
                ? [CoordinateMapper.fromCoordinateToMarkerInfo(city.location)]
                : []
            }
          />
        </div>
      </Center>
      <Center>
        <Button background={BRAND_COLOR} isDisabled={city.name.length < 3} onClick={handleCitySave}>
          Save
        </Button>
      </Center>
    </Flex>
  )
}
