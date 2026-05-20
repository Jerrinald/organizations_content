// Schémas zod pour les articles, alignés sur les DTO Input backend.

import { z } from 'zod'
import { ArticleStatus } from '@/types/enums'

// Slug fourni → doit matcher le regex (sinon 422) ; vide → backend slugifie.
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const slugMessage = 'Le slug doit être en kebab-case (minuscules, chiffres et tirets).'

// Search params de la liste. `coerce` car l'URL n'a que des strings ; `.catch()`
// rend le parsing tolérant (URL malformée → défaut au lieu d'un throw qui casse
// la navigation). `max(100)` reflète le cap backend.
export const articleSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  status: z
    .enum([ArticleStatus.Draft, ArticleStatus.Published, ArticleStatus.Archived])
    .optional()
    .catch(undefined),
})

export type ArticleSearch = z.infer<typeof articleSearchSchema>

// Source unique des defaults pour les liens entrants qui doivent fournir un
// `search` complet (le typing TanStack Router exige toutes les clés).
export const ARTICLE_SEARCH_DEFAULTS: ArticleSearch = { page: 1, limit: 20 }

// slug vide côté form → transform en undefined → le backend slugifie depuis le
// titre (AsciiSlugger).
export const createArticleSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255, 'Maximum 255 caractères'),
  content: z.string().min(1, 'Le contenu est requis'),
  slug: z
    .string()
    .max(255, 'Maximum 255 caractères')
    .refine((v) => v === '' || slugRegex.test(v), slugMessage)
    .transform((v) => (v === '' ? undefined : v)),
})

// z.input = valeurs AVANT transform (defaultValues RHF), z.infer = APRÈS.
export type CreateArticleFormValues = z.input<typeof createArticleSchema>
export type CreateArticleParsed = z.infer<typeof createArticleSchema>

// PATCH backend = tous champs optionnels, mais on garde min(1) côté form (vider
// n'a pas de sens UX) et on n'envoie que les dirtyFields RHF.
export const updateArticleSchema = z.object({
  title: z.string().min(1, 'Le titre ne peut pas être vide').max(255, 'Maximum 255 caractères'),
  content: z.string().min(1, 'Le contenu ne peut pas être vide'),
  slug: z
    .string()
    .min(1, 'Le slug ne peut pas être vide')
    .max(255, 'Maximum 255 caractères')
    .regex(slugRegex, slugMessage),
})

export type UpdateArticleFormValues = z.infer<typeof updateArticleSchema>
