// Mappe une erreur HTTP vers { fieldErrors, rootError }, consommable par un form
// React 19 (state plat) comme par RHF (setError). Trois cas Symfony :
//   1. 422 + violations → erreurs par propertyPath (filtré sur l'allowlist `fields`)
//   2. status mappé (409, 422 métier sans violations) → erreur sur un champ unique
//   3. le reste (403, 5xx, network) → rootError

import { errorMessage, isHttpError, isValidationError } from './http-error'

export interface MapFieldErrorsOptions<F extends string> {
  /** Allowlist des champs affichables sur le form courant. */
  fields: readonly F[]
  /** Mapping HTTP status → champ cible pour les erreurs sans `violations` (409, 422 métier...). */
  statusToField?: Partial<Record<number, F>>
}

export interface MappedFieldErrors<F extends string> {
  fieldErrors: Partial<Record<F, string>>
  rootError?: string
}

export function mapFieldErrors<F extends string>(
  err: unknown,
  options: MapFieldErrorsOptions<F>,
): MappedFieldErrors<F> {
  const allowed = new Set<string>(options.fields)

  // 1. 422 + violations
  if (isHttpError(err) && isValidationError(err)) {
    const fieldErrors: Partial<Record<F, string>> = {}
    for (const v of err.body.violations) {
      if (allowed.has(v.propertyPath) && !fieldErrors[v.propertyPath as F]) {
        fieldErrors[v.propertyPath as F] = v.title
      }
    }
    if (Object.keys(fieldErrors).length === 0) {
      return { fieldErrors, rootError: errorMessage(err) }
    }
    return { fieldErrors }
  }

  // 2. HttpError dont le status est mappé sur un champ
  if (isHttpError(err) && options.statusToField) {
    const target = options.statusToField[err.status]
    if (target) {
      return { fieldErrors: { [target]: errorMessage(err) } as Partial<Record<F, string>> }
    }
  }

  // 3. Fallback
  return { fieldErrors: {}, rootError: errorMessage(err) }
}
