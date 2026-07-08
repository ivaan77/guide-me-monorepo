import { useAuth } from '@clerk/clerk-expo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MePath } from '@guide-me-app/core'
import { apiDeleteAuthedNoContent } from '../lib/authedApi'
import { clearAuthChoice } from '../providers/AuthChoice'

// Deletes the user's account end-to-end:
//   1. DELETE /me  → wipes the Mongo user doc (favorites embedded on it are
//      dropped in the same op) and the Clerk identity server-side.
//   2. Clears the persisted auth-choice so AuthGate routes back to /login
//      on the next render — the account is gone, guest mode would be
//      misleading.
//   3. signOut() — Clerk clears its on-device session tokens (SecureStore).
//   4. qc.clear() — drops all cached user-scoped queries (/me, favorites,
//      anything else keyed by session).
// Device preferences (theme, language) are intentionally left alone —
// they're not tied to the account identity.
export function useDeleteAccount() {
  const { getToken, signOut } = useAuth()
  const qc = useQueryClient()

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiDeleteAuthedNoContent(MePath.me, { getToken: () => getToken() })
      await clearAuthChoice()
      await signOut()
      qc.clear()
    },
  })
}
