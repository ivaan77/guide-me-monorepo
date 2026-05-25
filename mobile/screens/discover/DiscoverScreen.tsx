import { useMemo, useState } from 'react'
import { FlatList, ScrollView, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { XStack, YStack, useTheme } from 'tamagui'
import { useCities } from '../../hooks/useCities'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { CityCard } from './CityCard'
import { CityCardSkeleton } from './CityCardSkeleton'
import { EmptyState } from './EmptyState'
import { SearchBar } from './SearchBar'

const GUTTER = 16
const H_PADDING = 20
const SEARCH_DEBOUNCE_MS = 250
const SKELETON_COUNT = 8
const TAB_BAR_HEIGHT = 49

export function DiscoverScreen() {
  const { width } = useWindowDimensions()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const cardWidth = (width - H_PADDING * 2 - GUTTER) / 2

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)

  const bottomPadding = insets.bottom + TAB_BAR_HEIGHT + 16

  const { data, isPending, isError, error, refetch } = useCities()

  const filtered = useMemo(() => {
    if (!data) return []
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (city) =>
        city.name.toLowerCase().includes(q) ||
        city.country.toLowerCase().includes(q),
    )
  }, [data, debouncedQuery])

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
    <YStack flex={1} bg="$background" pt={insets.top}>
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
            message={error instanceof Error ? error.message : undefined}
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
