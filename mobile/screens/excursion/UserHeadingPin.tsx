import { Marker } from 'react-native-maps'
import Svg, { Circle, Defs, RadialGradient, Stop, Path } from 'react-native-svg'
import { View } from 'react-native'
import { useTheme } from 'tamagui'
import type { PublicLatLng } from '@guide-me-app/core'

const PIN_SIZE = 64
const DOT_SIZE = 18
const CONE_SIZE = PIN_SIZE

type Props = {
  coords: PublicLatLng
  // Compass heading in degrees, 0 = north, clockwise. Pass null to render
  // a plain dot with no cone (e.g. before headings arrive, or when the
  // device doesn't have a magnetometer).
  heading: number | null
}

// Custom user location marker with a Google-Maps-style cone fanning forward
// in the direction the device is facing. The cone is a soft radial gradient
// so its leading edge fades into the map; the inner dot is a solid blue
// circle with a thin white outline for visibility on any background.
export function UserHeadingPin({ coords, heading }: Props) {
  const theme = useTheme()
  const primary = theme.primary?.val ?? '#2A5BD7'

  // The marker positions the SVG's center at `coords`. The cone is drawn
  // pointing "up" (heading 0); we rotate the whole SVG by `heading` so the
  // cone aligns with the device's true north. When heading is null we
  // suppress the cone entirely.
  return (
    <Marker
      coordinate={coords}
      anchor={{ x: 0.5, y: 0.5 }}
      // Without tracksViewChanges=false the marker re-renders constantly
      // and burns CPU. We bump it manually via the SVG re-rendering on
      // heading changes (the View key forces native to refresh the bitmap).
      tracksViewChanges
      flat
    >
      <View
        style={{
          width: PIN_SIZE,
          height: PIN_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg
          width={CONE_SIZE}
          height={CONE_SIZE}
          viewBox={`0 0 ${CONE_SIZE} ${CONE_SIZE}`}
          style={{
            position: 'absolute',
            transform: [{ rotate: `${heading ?? 0}deg` }],
            opacity: heading == null ? 0 : 1,
          }}
        >
          <Defs>
            <RadialGradient
              id="coneGrad"
              cx={CONE_SIZE / 2}
              cy={CONE_SIZE / 2}
              r={CONE_SIZE / 2}
              fx={CONE_SIZE / 2}
              fy={CONE_SIZE / 2}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={primary} stopOpacity="0.85" />
              <Stop offset="0.6" stopColor={primary} stopOpacity="0.25" />
              <Stop offset="1" stopColor={primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          {/* Pie-slice path: arc from -30° to -150° (i.e. 60° wedge facing up). */}
          <Path
            d={describeWedge(
              CONE_SIZE / 2,
              CONE_SIZE / 2,
              CONE_SIZE / 2,
              -30,
              -150,
            )}
            fill="url(#coneGrad)"
          />
        </Svg>
        {/* Inner dot — same regardless of heading availability. */}
        <Svg
          width={DOT_SIZE + 6}
          height={DOT_SIZE + 6}
          viewBox={`0 0 ${DOT_SIZE + 6} ${DOT_SIZE + 6}`}
        >
          <Circle
            cx={(DOT_SIZE + 6) / 2}
            cy={(DOT_SIZE + 6) / 2}
            r={DOT_SIZE / 2 + 2}
            fill="#FFFFFF"
          />
          <Circle
            cx={(DOT_SIZE + 6) / 2}
            cy={(DOT_SIZE + 6) / 2}
            r={DOT_SIZE / 2}
            fill={primary}
          />
        </Svg>
      </View>
    </Marker>
  )
}

// Builds an SVG path describing a wedge (pie slice) centered at (cx, cy)
// with radius `r`, swept from `startDeg` to `endDeg`. Degrees follow SVG
// convention: 0 = right, 90 = down. We pass -30/-150 to produce a wedge
// pointing straight up (a 60° fan around the vertical).
function describeWedge(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polar(cx, cy, r, endDeg)
  const end = polar(cx, cy, r, startDeg)
  const largeArc = endDeg - startDeg <= 180 ? '0' : '1'
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
