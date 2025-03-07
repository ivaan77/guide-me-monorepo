import { BRAND_COLOR, OnClickHandler } from '@guide-me-app/core'
import { ReactElement } from 'react'
import { Button, Flex } from '@chakra-ui/react'
import { TourGuidePlace } from '@/types'

type Props = {
    onCancel: OnClickHandler
    onSave: OnClickHandler
    tourPlace: TourGuidePlace
}

export const TourActionsFooter = ({ tourPlace, onSave, onCancel }: Props): ReactElement => (
    <section
        style={{
            position: 'fixed',
            borderTop: '1px solid #ededed',
            bottom: 0,
            left: 0,
            width: '100%',
            padding: 16,
            marginTop: 12,
            background: '#f9f9f9',
        }}
    >
        <Flex flexDirection="row-reverse" gap={8}>
            <Button
                isDisabled={isSaveDisabled(tourPlace)}
                type="submit"
                background={BRAND_COLOR}
                onClick={onSave}
            >
                Save
            </Button>
            <Button type="button" onClick={onCancel}>
                Back
            </Button>
        </Flex>
    </section>
)

const isSaveDisabled = (place: TourGuidePlace): boolean => {
    return (
        !place?.cityId ||
        place.name.trim().length < 3 ||
        place.tourSpots.length == 0 ||
        place.directions.length == 0
    )
}
