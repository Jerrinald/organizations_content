// Appels HTTP d'auth. skipAuth + skipOrganization = endpoints publics.

import { apiFetch } from './api'
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
} from '@/types/auth'

export const loginRequest = (email: string, password: string) =>
  apiFetch<LoginResponse>('/api/login', {
    method: 'POST',
    body: { username: email, password } satisfies LoginRequest,
    skipAuth: true,
    skipOrganization: true,
  })

export const refreshRequest = (refreshToken: string) =>
  apiFetch<RefreshResponse>('/api/token/refresh', {
    method: 'POST',
    body: { refresh_token: refreshToken } satisfies RefreshRequest,
    skipAuth: true,
    skipOrganization: true,
  })
