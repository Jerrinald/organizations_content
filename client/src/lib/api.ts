// Wrapper fetch typé : BASE_URL, Authorization + X-Organization-Id auto, JSON,
// refresh-retry sur 401, throw HttpError sur non-2xx. Le wiring (store, refresh,
// logout) est injecté par configureApi() au boot (api-bootstrap.ts) — pas de
// dépendance directe au store ici (testabilité, pas de cycle).

import { HttpError } from './http-error'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

let getAccessToken: () => string | null = () => null
let getOrganizationId: () => string | null = () => null
let refreshAccessToken: () => Promise<boolean> = async () => false
let onAuthFailure: () => void = () => {}

export interface ApiConfig {
  getAccessToken?: () => string | null
  getOrganizationId?: () => string | null
  /** Tente un refresh. true = succès (token mis à jour dans le store), false = échec. */
  refreshAccessToken?: () => Promise<boolean>
  /** Auth irrécupérable (refresh impossible ou refusé) → typiquement logout(). */
  onAuthFailure?: () => void
}

export function configureApi(config: ApiConfig): void {
  if (config.getAccessToken) getAccessToken = config.getAccessToken
  if (config.getOrganizationId) getOrganizationId = config.getOrganizationId
  if (config.refreshAccessToken) refreshAccessToken = config.refreshAccessToken
  if (config.onAuthFailure) onAuthFailure = config.onAuthFailure
}

export interface ApiOptions extends Omit<RequestInit, 'body' | 'headers'> {
  /** JSON body — sera stringifié. Pour upload binaire, passer un FormData directement. */
  body?: unknown
  headers?: Record<string, string>
  /** Skip Authorization header (login, refresh). */
  skipAuth?: boolean
  /** Skip X-Organization-Id header (login, refresh, listing /api/organizations). */
  skipOrganization?: boolean
}

export function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  return apiFetchInternal<T>(path, options, false)
}

async function apiFetchInternal<T>(
  path: string,
  options: ApiOptions,
  isRetry: boolean,
): Promise<T> {
  const { body, headers = {}, skipAuth, skipOrganization, ...rest } = options

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  }

  const isFormData = body instanceof FormData
  if (body !== undefined && !isFormData) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  if (!skipAuth) {
    const token = getAccessToken()
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`
  }

  if (!skipOrganization) {
    const orgId = getOrganizationId()
    if (orgId) finalHeaders['X-Organization-Id'] = orgId
  }

  const url = `${BASE_URL}${path}`

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: isFormData
      ? (body as FormData)
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  })

  // 401 → tente un refresh une seule fois, puis retry. Si le refresh échoue,
  // on appelle onAuthFailure (logout) et on tombe sur le throw HttpError 401.
  if (response.status === 401 && !skipAuth && !isRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiFetchInternal<T>(path, options, true)
    }
    onAuthFailure()
  }

  if (!response.ok) {
    let errorBody: unknown = null
    try {
      errorBody = await response.json()
    } catch {
      // body absent ou non-JSON (5xx HTML par exemple)
    }
    throw new HttpError(response.status, url, errorBody)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
