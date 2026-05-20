// Wiring store auth ↔ apiFetch, importé en side-effect au boot (main.tsx).
// Mutex sur le refresh : des 401 parallèles partagent la même promesse → un seul
// appel /token/refresh.

import { configureApi } from './api'
import { refreshRequest } from './auth-service'
import { useAuthStore } from '@/stores/auth-store'
import { useOrgStore } from '@/stores/org-store'
import { isHttpError } from './http-error'

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessTokenWithMutex(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

async function doRefresh(): Promise<boolean> {
  const { refreshToken, setTokens } = useAuthStore.getState()
  if (!refreshToken) return false
  try {
    const tokens = await refreshRequest(refreshToken)
    setTokens(tokens.token, tokens.refresh_token)
    return true
  } catch (err) {
    if (isHttpError(err)) {
      console.warn('[auth] refresh failed:', err.status, err.body)
    }
    return false
  }
}

configureApi({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getOrganizationId: () => useOrgStore.getState().currentOrgId,
  refreshAccessToken: refreshAccessTokenWithMutex,
  onAuthFailure: () => useAuthStore.getState().logout(),
})

// Vide l'org-store au logout. Couplage à sens unique (org-store n'importe pas
// auth-store) ; la condition filtre les seules transitions accessToken → null.
useAuthStore.subscribe((state, prev) => {
  if (prev.accessToken !== null && state.accessToken === null) {
    useOrgStore.getState().clear()
  }
})
