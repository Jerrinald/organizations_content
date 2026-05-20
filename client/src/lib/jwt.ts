// Décode le payload JWT SANS vérifier la signature — lecture de claims publiques
// (username, exp) seulement. La sécurité reste côté backend qui valide la signature.

export interface JwtPayload {
  username?: string
  roles?: string[]
  exp?: number
  iat?: number
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}
