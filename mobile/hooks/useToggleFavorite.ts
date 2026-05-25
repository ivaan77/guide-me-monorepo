import { useCallback } from 'react'
import { useAuth } from '@clerk/clerk-expo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  type AddFavoriteRequest,
  type AddFavoriteResponse,
  type FavoriteRef,
  type MeResponse,
  MePath,
} from '@guide-me-app/core'
import {
  apiDeleteAuthed,
  apiPostAuthed,
  UnauthorizedError,
} from '../lib/authedApi'
import { ME_QUERY_KEY, useMe } from './useMe'

// Toggle a favorite. Optimistically patches the /me cache so the UI updates
// instantly, then reconciles with the server response. Returns:
//   - `isFavorite(ref)` — derived from current /me data
//   - `toggle(ref)` — flips state; throws UnauthorizedError when guest
export function useToggleFavorite() {
  const { isSignedIn, getToken } = useAuth()
  const qc = useQueryClient()
  const { data: me } = useMe()

  const isFavorite = useCallback(
    (ref: FavoriteRef): boolean =>
      !!me?.favorites.some((f) => f.type === ref.type && f.id === ref.id),
    [me],
  )

  const add = useMutation<
    AddFavoriteResponse,
    Error,
    FavoriteRef,
    { prev: MeResponse | undefined }
  >({
    mutationFn: (ref) =>
      apiPostAuthed<AddFavoriteRequest, AddFavoriteResponse>(
        MePath.favorites,
        ref,
        { getToken: () => getToken() },
      ),
    onMutate: async (ref) => {
      await qc.cancelQueries({ queryKey: ME_QUERY_KEY })
      const prev = qc.getQueryData<MeResponse>(ME_QUERY_KEY)
      if (prev) {
        qc.setQueryData<MeResponse>(ME_QUERY_KEY, {
          ...prev,
          favorites: [...prev.favorites, ref],
        })
      }
      return { prev }
    },
    onError: (_err, _ref, ctx) => {
      if (ctx?.prev) qc.setQueryData(ME_QUERY_KEY, ctx.prev)
    },
    onSuccess: (res) => {
      qc.setQueryData<MeResponse | undefined>(ME_QUERY_KEY, (curr) =>
        curr ? { ...curr, favorites: res.favorites } : curr,
      )
    },
  })

  const remove = useMutation<
    AddFavoriteResponse,
    Error,
    FavoriteRef,
    { prev: MeResponse | undefined }
  >({
    mutationFn: (ref) =>
      apiDeleteAuthed<AddFavoriteResponse>(
        MePath.deleteFavorite(ref.type, ref.id),
        { getToken: () => getToken() },
      ),
    onMutate: async (ref) => {
      await qc.cancelQueries({ queryKey: ME_QUERY_KEY })
      const prev = qc.getQueryData<MeResponse>(ME_QUERY_KEY)
      if (prev) {
        qc.setQueryData<MeResponse>(ME_QUERY_KEY, {
          ...prev,
          favorites: prev.favorites.filter(
            (f) => !(f.type === ref.type && f.id === ref.id),
          ),
        })
      }
      return { prev }
    },
    onError: (_err, _ref, ctx) => {
      if (ctx?.prev) qc.setQueryData(ME_QUERY_KEY, ctx.prev)
    },
    onSuccess: (res) => {
      qc.setQueryData<MeResponse | undefined>(ME_QUERY_KEY, (curr) =>
        curr ? { ...curr, favorites: res.favorites } : curr,
      )
    },
  })

  const toggle = useCallback(
    (ref: FavoriteRef): Promise<void> => {
      if (!isSignedIn) {
        return Promise.reject(new UnauthorizedError())
      }
      if (isFavorite(ref)) {
        return remove.mutateAsync(ref).then(() => undefined)
      }
      return add.mutateAsync(ref).then(() => undefined)
    },
    [isSignedIn, isFavorite, add, remove],
  )

  return {
    isFavorite,
    toggle,
    isPending: add.isPending || remove.isPending,
  }
}
