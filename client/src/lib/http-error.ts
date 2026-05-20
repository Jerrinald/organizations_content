// Erreur HTTP normalisée (toute réponse non-2xx). `body: unknown` narrowé par les
// type guards plus bas selon le status (notamment 422 → violations).

export class HttpError extends Error {
  readonly status: number
  readonly url: string
  readonly body: unknown

  constructor(status: number, url: string, body: unknown) {
    super(`HTTP ${status} on ${url}`)
    this.name = 'HttpError'
    this.status = status
    this.url = url
    this.body = body
  }
}

export const isHttpError = (e: unknown): e is HttpError => e instanceof HttpError

// Erreur de validation Symfony (MapRequestPayload + Validator).
export interface ValidationViolation {
  propertyPath: string
  title: string
  type?: string
  parameters?: Record<string, unknown>
}

export interface ValidationErrorBody {
  type?: string
  title?: string
  status?: number
  detail?: string
  violations: ValidationViolation[]
}

export const isValidationError = (
  err: HttpError,
): err is HttpError & { body: ValidationErrorBody } =>
  err.status === 422 &&
  typeof err.body === 'object' &&
  err.body !== null &&
  'violations' in err.body &&
  Array.isArray((err.body as { violations: unknown }).violations)

// Erreur Symfony "simple" (HttpException avec message) : 409, 404, etc.
export interface SimpleErrorBody {
  type?: string
  title?: string
  status?: number
  detail?: string
}

export const errorMessage = (err: unknown): string => {
  if (isHttpError(err)) {
    if (typeof err.body === 'object' && err.body !== null) {
      const body = err.body as Partial<SimpleErrorBody>
      if (typeof body.detail === 'string') return body.detail
      if (typeof body.title === 'string') return body.title
    }
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Erreur inconnue'
}
