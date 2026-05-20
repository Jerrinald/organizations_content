// Payloads d'auth (Lexik JWT + Gesdinet refresh). json_login attend `username`
// (mappé sur l'email via security.yaml).

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  refresh_token: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface RefreshResponse {
  token: string
  refresh_token: string
}
