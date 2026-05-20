// Schéma zod aligné sur InviteMemberInput (Email + Length(180) + Choice).
// INVITABLE_ROLES (types/enums.ts) = source unique, partagée avec le <select>.

import { z } from 'zod'
import { INVITABLE_ROLES } from '@/types/enums'

export const inviteMemberSchema = z.object({
  email: z
    .email({ message: 'Email invalide.' })
    .min(1, { message: "L'email est requis." })
    .max(180, { message: "L'email ne doit pas dépasser 180 caractères." }),
  role: z.enum(INVITABLE_ROLES, {
    message: 'Rôle invalide. Valeurs autorisées : Admin, Editor, Viewer.',
  }),
})

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>
