import { useEffect, useState } from 'react'
import { FlatList, ScrollView, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePostHog } from 'posthog-react-native'
import { XStack, YStack, useTheme } from 'tamagui'
import type { PublicCity } from '@guide-me-app/core'
import { useCities } from '../../hooks/useCities'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFuzzySearch } from '../../hooks/useFuzzySearch'
import { useTabBarPadding } from '../../hooks/useTabBarPadding'
import { CityCard } from './CityCard'
import { CityCardSkeleton } from './CityCardSkeleton'
import { EmptyState } from './EmptyState'
import { SearchBar } from './SearchBar'

const GUTTER = 16
const H_PADDING = 20
const SEARCH_DEBOUNCE_MS = 350
const SKELETON_COUNT = 8

// Fields on PublicCity we want the fuzzy matcher to consider. Explicit
// tuple (not derived) so TypeScript catches drift if PublicCity changes.
const SEARCH_KEYS: (keyof PublicCity & string)[] = ['name', 'country']

export function DiscoverScreen() {
  const { width } = useWindowDimensions()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const cardWidth = (width - H_PADDING * 2 - GUTTER) / 2

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const posthog = usePostHog()

  const bottomPadding = useTabBarPadding()

  const { data, isPending, isError, error, refetch } = useCities()

  // Fuzzy match on name + country, diacritic-insensitive. Handles typos
  // ("zabreb" → Zagreb) and diacritic-free input ("sibenik" → Šibenik).
  // Debounced query keeps the Fuse index off the render hot path.
  const filtered = useFuzzySearch(data, SEARCH_KEYS, debouncedQuery)

  // Fire `search_performed` once per debounced query (skip empty). PII
  // guard: never send the raw text — length + result count only. Signal
  // is "did the search yield anything?", not "what did they search for."
  useEffect(() => {
    if (!debouncedQuery.trim()) return
    if (isPending || isError) return
    posthog?.capture('search_performed', {
      query_length: debouncedQuery.trim().length,
      result_count: filtered.length,
      had_results: filtered.length > 0,
    })
  }, [debouncedQuery, filtered.length, isPending, isError, posthog])

  const bg = theme.background.val

  const header = (
    <SearchBar
      value={query}
      onChange={setQuery}
      hPadding={H_PADDING}
      disabled={isPending || isError}
    />
  )

  return (
    <YStack flex={1} bg="$background" pt={insets.top + 8}>
      {renderBody()}
    </YStack>
  )

  function renderBody() {
    if (isPending) {
      return <SkeletonGrid header={header} cardWidth={cardWidth} bg={bg} />
    }

    if (isError) {
      return (
        <NonScrollableState header={header}>
          <EmptyState
            variant="error"
            // Raw error.message can be unfriendly text like "Aborted" when
            // react-query cancels an in-flight fetch on unmount/navigate.
            // Surface curated copy unless we have a real human message.
            message={friendlyErrorMessage(error)}
            onRetry={() => refetch()}
          />
        </NonScrollableState>
      )
    }

    if (filtered.length === 0) {
      return (
        <NonScrollableState header={header}>
          <EmptyState variant="no-results" query={debouncedQuery} />
        </NonScrollableState>
      )
    }

    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={{ backgroundColor: bg }}
        contentContainerStyle={{
          paddingHorizontal: H_PADDING,
          paddingBottom: bottomPadding,
          backgroundColor: bg,
          flexGrow: 1,
        }}
        columnWrapperStyle={{ gap: GUTTER }}
        ItemSeparatorComponent={() => <YStack height={GUTTER} />}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        ListHeaderComponent={header}
        renderItem={({ item }) => <CityCard city={item} width={cardWidth} />}
      />
    )
  }
}

function SkeletonGrid({
  header,
  cardWidth,
  bg,
}: {
  header: React.ReactNode
  cardWidth: number
  bg: string
}) {
  const rows = Math.ceil(SKELETON_COUNT / 2)
  return (
    <ScrollView
      style={{ backgroundColor: bg }}
      contentContainerStyle={{
        paddingHorizontal: H_PADDING,
        paddingBottom: 24,
        backgroundColor: bg,
        flexGrow: 1,
      }}
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    >
      {header}
      <YStack gap={GUTTER}>
        {Array.from({ length: rows }, (_, rowIdx) => (
          <XStack key={rowIdx} gap={GUTTER}>
            <CityCardSkeleton width={cardWidth} />
            <CityCardSkeleton width={cardWidth} />
          </XStack>
        ))}
      </YStack>
    </ScrollView>
  )
}

function NonScrollableState({
  header,
  children,
}: {
  header: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <YStack flex={1} bg="$background">
      <YStack px={H_PADDING}>{header}</YStack>
      <YStack flex={1} px={H_PADDING}>
        {children}
      </YStack>
    </YStack>
  )
}

// Returns an error message safe to show to users, or undefined to let the
// EmptyState fall back to its localized default. Filters out internal /
// transient errors:
//   - AbortError (fetch cancelled when react-query refocuses or component
//     unmounts mid-request) — typically surfaces as message "Aborted".
//   - Empty strings and "Error" placeholders.
function friendlyErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined
  const msg = error.message?.trim()
  if (!msg) return undefined
  if (error.name === 'AbortError') return undefined
  if (/^aborted$/i.test(msg)) return undefined
  return msg
}
