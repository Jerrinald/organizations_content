// Schémas zod alignés sur les DTO Input backend (*Organization*Input.php).

import { z } from 'zod'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const slugMessage = 'Le slug doit être en kebab-case (minuscules, chiffres et tirets).'

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Maximum 255 caractères'),
  slug: z
    .string()
    .min(1, 'Le slug est requis')
    .max(255, 'Maximum 255 caractères')
    .regex(slugRegex, slugMessage),
})

export type CreateOrganizationFormValues = z.infer<typeof createOrganizationSchema>

// PATCH backend = champs optionnels, mais on garde min(1) côté form (vider n'a pas
// de sens UX) et on filtre via dirtyFields RHF.
export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Maximum 255 caractères'),
  slug: z
    .string()
    .min(1, 'Le slug ne peut pas être vide')
    .max(255, 'Maximum 255 caractères')
    .regex(slugRegex, slugMessage),
})

export type UpdateOrganizationFormValues = z.infer<typeof updateOrganizationSchema>
