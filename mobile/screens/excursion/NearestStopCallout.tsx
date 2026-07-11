import { useTranslation } from 'react-i18next'
import { Marker } from 'react-native-maps'
import { MapPin } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import type { PublicLatLng } from '@guide-me-app/core'
import { palette } from '../../constants/Colors'
import { SHADOW } from '../../constants/Sizes'

// Navy text reads cleanly on the bright accent — same pairing used by the
// FloatingFactBanner / FloatingFactPlayer.
const ON_ACCENT = palette.navy

type Props = {
  coords: PublicLatLng
}

// Floating "Nearest" pill marker placed at a stop's coords during preview.
// The pill points down toward the actual stop pin via the anchor offset:
// anchored at (0.5, 1) on the chip means the chip's bottom-center sits on
// the coord, so the chip floats *above* the pin without overlapping it.
// Rendered as a non-interactive map child — taps still hit the underlying
// stop pin since the anchor is offset above it.
export function NearestStopCallout({ coords }: Props) {
  const { t } = useTranslation()
  return (
    <Marker
      coordinate={coords}
      anchor={{ x: 0.5, y: 2.4 }}
      tracksViewChanges={false}
      // zIndex above default markers so the chip floats clearly.
      zIndex={20}
    >
      <YStack items="center">
        <XStack
          items="center"
          gap={4}
          px="$2"
          py="$1"
          rounded="$10"
          bg="$accent"
          style={SHADOW.amberPill}
        >
          <MapPin size={11} color={ON_ACCENT as any} />
          <SizableText
            size="$1"
            fontFamily="$body"
            fontWeight="800"
            style={{
              color: ON_ACCENT,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            {t('excursion.startFrom.nearestBadge', { defaultValue: 'Nearest' })}
          </SizableText>
        </XStack>
        {/* Triangle tail pointing down at the pin. Subtle but ties the
            chip visually to the marker beneath. */}
        <YStack
          width={0}
          height={0}
          style={{
            borderLeftWidth: 5,
            borderRightWidth: 5,
            borderTopWidth: 6,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: '#F59E0B',
          }}
        />
      </YStack>
    </Marker>
  )
}
