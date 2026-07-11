import { Marker } from 'react-native-maps'
import { View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { SizableText, YStack } from 'tamagui'
import type { PublicLatLng } from '@guide-me-app/core'
import { SHADOW } from '../../constants/Sizes'

// Violet accent used wherever a stop with sub-stops appears (map pin,
// stops list row, bundle controls). Distinct enough from the primary
// blue/teal that the user reads "this is a multi-stop place" at a glance.
export const BUNDLE_ACCENT = '#7C3AED'

const DOT_SIZE = 14
export const SUB_STOP_RING_RADIUS_METERS = 12

// Distribute N sub-stops on a tiny circle around the parent coord so each
// one gets a unique location even though sub-stops inherit the parent's
// coords in the schema. The ring is small (~12m) so visually they read as
// satellites of the parent pin rather than separate destinations. Returns
// the offset coordinates aligned to the sub-stop index order.
export function ringPositionsAroundParent(
  parent: PublicLatLng,
  count: number,
): PublicLatLng[] {
  if (count <= 0) return []
  const mPerDegLat = 111320
  const mPerDegLng = 111320 * Math.cos((parent.latitude * Math.PI) / 180)
  const positions: PublicLatLng[] = []
  for (let i = 0; i < count; i++) {
    // Start at the top of the ring (12 o'clock) and step clockwise so the
    // first sub-stop sits "above" the parent — predictable for the user.
    const angle = (-Math.PI / 2) + (i / count) * 2 * Math.PI
    const dLat = (Math.sin(angle) * SUB_STOP_RING_RADIUS_METERS) / mPerDegLat
    const dLng = (Math.cos(angle) * SUB_STOP_RING_RADIUS_METERS) / mPerDegLng
    positions.push({
      latitude: parent.latitude + dLat,
      longitude: parent.longitude + dLng,
    })
  }
  return positions
}

// Small violet dot Marker for a sub-stop. Sits at a ring-distributed
// offset around the parent bundle pin. Tap fires onPress to open the
// sub-stop's detail sheet.
export function SubStopDot({
  coords,
  onPress,
}: {
  coords: PublicLatLng
  onPress?: () => void
}) {
  return (
    <Marker
      coordinate={coords}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      onPress={onPress}
    >
      <View
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: BUNDLE_ACCENT,
          borderWidth: 2,
          borderColor: '#FFFFFF',
        }}
      />
    </Marker>
  )
}

const PIN_WIDTH = 32
const PIN_HEIGHT = 44
const BADGE_SIZE = 20

type Props = {
  coords: PublicLatLng
  count: number
  // Visited (already passed in the route): renders the pin in muted grey.
  visited?: boolean
  // Optional callout content (title/description) — react-native-maps' default
  // tap behavior shows the system callout if you set these.
  title?: string
  description?: string
}

// Custom map pin for "bundle" stops — stops whose subStops array is
// non-empty. Drops a violet teardrop with a white-circle number badge in
// the top-right corner. Matches the visual contract of the default map
// pins (anchored at the tip) so heading-up animation + fitToCoordinates
// work the same as for regular stops.
export function StopBundlePin({
  coords,
  count,
  visited,
  title,
  description,
}: Props) {
  const pinColor = visited ? '#9CA3AF' : BUNDLE_ACCENT
  return (
    <Marker
      coordinate={coords}
      // Anchor at the tip so the pin's bottom-center lands on the coord
      // (matches the default Marker behavior).
      anchor={{ x: 0.5, y: 1 }}
      title={title}
      description={description}
      tracksViewChanges={false}
    >
      <View
        style={{
          width: PIN_WIDTH + BADGE_SIZE / 2,
          height: PIN_HEIGHT + BADGE_SIZE / 2,
        }}
      >
        <Svg
          width={PIN_WIDTH}
          height={PIN_HEIGHT}
          viewBox={`0 0 ${PIN_WIDTH} ${PIN_HEIGHT}`}
          style={{ position: 'absolute', left: 0, bottom: 0 }}
        >
          {/* Teardrop: circle on top, triangle pointing down to the tip. */}
          <Path
            d={`M ${PIN_WIDTH / 2} ${PIN_HEIGHT}
                L ${PIN_WIDTH * 0.18} ${PIN_HEIGHT * 0.55}
                A ${PIN_WIDTH * 0.45} ${PIN_WIDTH * 0.45} 0 1 1 ${PIN_WIDTH * 0.82} ${PIN_HEIGHT * 0.55}
                Z`}
            fill={pinColor}
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
          <Circle
            cx={PIN_WIDTH / 2}
            cy={PIN_WIDTH * 0.45}
            r={PIN_WIDTH * 0.16}
            fill="#FFFFFF"
            opacity={0.9}
          />
        </Svg>
        <YStack
          position="absolute"
          t={0}
          r={0}
          width={BADGE_SIZE}
          height={BADGE_SIZE}
          rounded={BADGE_SIZE / 2}
          bg="#FFFFFF"
          items="center"
          justify="center"
          style={{
            borderWidth: 1.5,
            borderColor: pinColor,
            ...SHADOW.pinTight,
          }}
        >
          <SizableText
            size="$1"
            fontFamily="$body"
            fontWeight="800"
            style={{ color: pinColor, lineHeight: BADGE_SIZE }}
          >
            {count}
          </SizableText>
        </YStack>
      </View>
    </Marker>
  )
}
