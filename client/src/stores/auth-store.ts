// Store auth persisté (localStorage). accessToken persisté volontairement (pas de
// re-login au reload) ; sécurité = JWT court + refresh token + logout sur 401
// irrécupérable. Wiring : api-bootstrap.ts.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  email: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null

  login: (accessToken: string, refreshToken: string, user: AuthUser) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      login: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'auth-store' },
  ),
)

// Sélecteurs unitaires : minimisent les re-renders (s'abonner à une seule clé).
export const useUser = () => useAuthStore((s) => s.user)
export const useAccessToken = () => useAuthStore((s) => s.accessToken)
export const useIsAuthenticated = () => useAuthStore((s) => s.accessToken !== null)
