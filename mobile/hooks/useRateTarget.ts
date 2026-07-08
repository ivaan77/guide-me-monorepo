import { useCallback } from 'react'
import { useAuth } from '@clerk/clerk-expo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MePath,
  type MeResponse,
  type PublicRatingAggregate,
  type RateRequest,
  type RateResponse,
  type RatingTargetType,
  type RatingValue,
  type RemoveRatingResponse,
} from '@guide-me-app/core'
import {
  apiDeleteAuthed,
  apiPostAuthed,
  UnauthorizedError,
} from '../lib/authedApi'
import { ME_QUERY_KEY } from './useMe'

// Query-key convention: match how the existing entity hooks key their
// caches. useCity uses ['city', slug, locale]; same for excursion + place.
// Rating aggregates are locale-independent, so we patch every cached
// locale for a given (type, id) — that's what `queryKey: [type, id]` does
// when passed to setQueriesData (it prefix-matches).
type EntityQueryKeyPrefix = readonly [RatingTargetType, string]

function entityQueryKey(
  targetType: RatingTargetType,
  targetId: string,
): EntityQueryKeyPrefix {
  return [targetType, targetId] as const
}

type RateVars = {
  targetType: RatingTargetType
  targetId: string
  value: RatingValue
}

type RateContext = {
  prevMe: MeResponse | undefined
  // Snapshots of every cached locale for the target entity — used to roll
  // back if the write fails. Keys are opaque; setQueryData handles them.
  prevEntitySnapshots: Array<{ key: readonly unknown[]; data: unknown }>
  entityKeyPrefix: EntityQueryKeyPrefix
}

// Rate an entity (city / excursion / place). Optimistically updates both
// the /me cache (the user's own ratings list) and the entity cache (the
// public aggregate the detail screen shows). Rolls back both on error.
// Throws UnauthorizedError when guest — callers route to /login.
export function useRateTarget() {
  const { isSignedIn, getToken } = useAuth()
  const qc = useQueryClient()

  const rate = useMutation<RateResponse, Error, RateVars, RateContext>({
    mutationFn: (vars) =>
      apiPostAuthed<RateRequest, RateResponse>(
        MePath.ratings,
        vars,
        { getToken: () => getToken() },
      ),
    onMutate: async (vars) => {
      const entityKeyPrefix = entityQueryKey(vars.targetType, vars.targetId)
      await Promise.all([
        qc.cancelQueries({ queryKey: ME_QUERY_KEY }),
        qc.cancelQueries({ queryKey: entityKeyPrefix }),
      ])
      const prevMe = qc.getQueryData<MeResponse>(ME_QUERY_KEY)
      const prevEntitySnapshots = snapshotEntities(qc, entityKeyPrefix)

      // Patch /me: replace existing rating for this target, or append.
      if (prevMe) {
        const others = prevMe.ratings.filter(
          (r) =>
            !(
              r.targetType === vars.targetType && r.targetId === vars.targetId
            ),
        )
        qc.setQueryData<MeResponse>(ME_QUERY_KEY, {
          ...prevMe,
          ratings: [
            ...others,
            {
              targetType: vars.targetType,
              targetId: vars.targetId,
              value: vars.value,
            },
          ],
        })
      }

      // Patch entity aggregate for every cached locale variant.
      const prevValue = prevMe?.ratings.find(
        (r) =>
          r.targetType === vars.targetType && r.targetId === vars.targetId,
      )?.value
      qc.setQueriesData({ queryKey: entityKeyPrefix }, (curr: unknown) =>
        patchAggregate(curr, prevValue ?? null, vars.value, vars.targetType),
      )

      return { prevMe, prevEntitySnapshots, entityKeyPrefix }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      if (ctx.prevMe) qc.setQueryData(ME_QUERY_KEY, ctx.prevMe)
      restoreEntities(qc, ctx.prevEntitySnapshots)
    },
    onSuccess: (res, vars, ctx) => {
      if (!ctx) return
      const publicAgg: PublicRatingAggregate | undefined =
        res.aggregate.count > 0 && res.aggregate.avg !== null
          ? { avg: res.aggregate.avg, count: res.aggregate.count }
          : undefined
      qc.setQueriesData({ queryKey: ctx.entityKeyPrefix }, (curr: unknown) =>
        replaceAggregate(curr, publicAgg, vars.targetType),
      )
    },
  })

  const unrate = useMutation<
    RemoveRatingResponse,
    Error,
    { targetType: RatingTargetType; targetId: string },
    RateContext
  >({
    mutationFn: (vars) =>
      apiDeleteAuthed<RemoveRatingResponse>(
        MePath.deleteRating(vars.targetType, vars.targetId),
        { getToken: () => getToken() },
      ),
    onMutate: async (vars) => {
      const entityKeyPrefix = entityQueryKey(vars.targetType, vars.targetId)
      await Promise.all([
        qc.cancelQueries({ queryKey: ME_QUERY_KEY }),
        qc.cancelQueries({ queryKey: entityKeyPrefix }),
      ])
      const prevMe = qc.getQueryData<MeResponse>(ME_QUERY_KEY)
      const prevEntitySnapshots = snapshotEntities(qc, entityKeyPrefix)
      const prevValue = prevMe?.ratings.find(
        (r) =>
          r.targetType === vars.targetType && r.targetId === vars.targetId,
      )?.value

      if (prevMe) {
        qc.setQueryData<MeResponse>(ME_QUERY_KEY, {
          ...prevMe,
          ratings: prevMe.ratings.filter(
            (r) =>
              !(
                r.targetType === vars.targetType &&
                r.targetId === vars.targetId
              ),
          ),
        })
      }
      qc.setQueriesData({ queryKey: entityKeyPrefix }, (curr: unknown) =>
        patchAggregate(curr, prevValue ?? null, null, vars.targetType),
      )
      return { prevMe, prevEntitySnapshots, entityKeyPrefix }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      if (ctx.prevMe) qc.setQueryData(ME_QUERY_KEY, ctx.prevMe)
      restoreEntities(qc, ctx.prevEntitySnapshots)
    },
    onSuccess: (res, vars, ctx) => {
      if (!ctx) return
      const publicAgg: PublicRatingAggregate | undefined =
        res.aggregate.count > 0 && res.aggregate.avg !== null
          ? { avg: res.aggregate.avg, count: res.aggregate.count }
          : undefined
      qc.setQueriesData({ queryKey: ctx.entityKeyPrefix }, (curr: unknown) =>
        replaceAggregate(curr, publicAgg, vars.targetType),
      )
    },
  })

  const submit = useCallback(
    (targetType: RatingTargetType, targetId: string, value: RatingValue) => {
      if (!isSignedIn) return Promise.reject(new UnauthorizedError())
      return rate.mutateAsync({ targetType, targetId, value })
    },
    [isSignedIn, rate],
  )

  const clear = useCallback(
    (targetType: RatingTargetType, targetId: string) => {
      if (!isSignedIn) return Promise.reject(new UnauthorizedError())
      return unrate.mutateAsync({ targetType, targetId })
    },
    [isSignedIn, unrate],
  )

  return {
    submit,
    clear,
    isPending: rate.isPending || unrate.isPending,
  }
}

// --- Cache patching helpers ---

// Snapshot every cached query whose key starts with the given prefix.
// Used for rollback so we can restore multi-locale caches on error.
function snapshotEntities(
  qc: ReturnType<typeof useQueryClient>,
  prefix: readonly unknown[],
): Array<{ key: readonly unknown[]; data: unknown }> {
  return qc
    .getQueriesData({ queryKey: prefix })
    .map(([key, data]) => ({ key: key as readonly unknown[], data }))
}

function restoreEntities(
  qc: ReturnType<typeof useQueryClient>,
  snapshots: Array<{ key: readonly unknown[]; data: unknown }>,
): void {
  for (const s of snapshots) {
    qc.setQueryData(s.key, s.data)
  }
}


// The entity query caches wrap the public detail response, e.g. useCity
// stores { city: PublicCityDetail, locale }. The rating aggregate lives
// nested under `.city.rating` / `.excursion.rating` / `.place.rating`.
// This helper applies a delta locally without knowing exact response types.
function patchAggregate(
  curr: unknown,
  prevValue: number | null,
  newValue: number | null,
  targetType: RatingTargetType,
): unknown {
  if (!curr || typeof curr !== 'object') return curr
  const wrapperKey = targetType // 'city' | 'excursion' | 'place'
  const wrapper = (curr as Record<string, unknown>)[wrapperKey]
  if (!wrapper || typeof wrapper !== 'object') return curr

  const inner = wrapper as { rating?: PublicRatingAggregate }
  const prev = inner.rating ?? { avg: 0, count: 0 }
  const sum = prev.avg * prev.count
  const nextSum =
    sum + (newValue ?? 0) - (prevValue ?? 0)
  const nextCount =
    prev.count +
    (newValue !== null ? 1 : 0) -
    (prevValue !== null ? 1 : 0)
  const nextRating: PublicRatingAggregate | undefined =
    nextCount === 0
      ? undefined
      : { avg: Math.round((nextSum / nextCount) * 10) / 10, count: nextCount }

  return {
    ...(curr as Record<string, unknown>),
    [wrapperKey]: { ...inner, rating: nextRating },
  }
}

// Overwrite the entity's cached rating with an authoritative server-sent
// aggregate. Used in onSuccess to reconcile after concurrent writes.
// Passing `undefined` clears the rating (used when count drops to 0).
function replaceAggregate(
  curr: unknown,
  aggregate: PublicRatingAggregate | undefined,
  targetType: RatingTargetType,
): unknown {
  if (!curr || typeof curr !== 'object') return curr
  const wrapperKey = targetType
  const wrapper = (curr as Record<string, unknown>)[wrapperKey]
  if (!wrapper || typeof wrapper !== 'object') return curr
  const inner = wrapper as { rating?: PublicRatingAggregate }
  return {
    ...(curr as Record<string, unknown>),
    [wrapperKey]: { ...inner, rating: aggregate },
  }
}
