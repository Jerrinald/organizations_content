import { useActionState, useEffect, useRef } from 'react'
import { requestFormReset, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { InviteMemberInput } from '@/hooks/member-hooks'
import { inviteMemberSchema } from '@/schemas/member'
import { mapFieldErrors } from '@/lib/form-errors'
import { INVITABLE_ROLES, MemberRole, memberRoleLabel } from '@/types/enums'

interface FormState {
  status: 'idle' | 'success' | 'error'
  fieldErrors: { email?: string; role?: string }
  rootError?: string
}

const initialState: FormState = { status: 'idle', fieldErrors: {} }

// Controlled : la mutation appartient au parent (qui détient la liste), pour que
// son addOptimistic + l'await soient batchés dans la même transition.
interface InviteMemberFormProps {
  onInvite: (input: InviteMemberInput) => Promise<void>
}

export default function InviteMemberForm({ onInvite }: InviteMemberFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

  // useActionState : (prevState, formData) => Promise<newState>. React 19 sérialise
  // les inputs nommés en FormData et appelle l'action passée à <form action={...}>.
  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const raw = {
      email: formData.get('email')?.toString().trim() ?? '',
      role: formData.get('role')?.toString() ?? '',
    }

    // Validation client (défense en profondeur — le backend valide aussi).
    const parsed = inviteMemberSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: FormState['fieldErrors'] = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'email' && !fieldErrors.email) fieldErrors.email = issue.message
        else if (key === 'role' && !fieldErrors.role) fieldErrors.role = issue.message
      }
      return { status: 'error', fieldErrors }
    }

    try {
      await onInvite(parsed.data)
      return { status: 'success', fieldErrors: {} }
    } catch (err) {
      const { fieldErrors, rootError } = mapFieldErrors(err, {
        fields: ['email', 'role'] as const,
        statusToField: { 409: 'email', 422: 'email' },
      })
      return { status: 'error', fieldErrors, rootError }
    }
  }, initialState)

  // useActionState ne reset pas le form automatiquement → requestFormReset
  // (API react-dom R19, intégrée aux Transitions, vs un reset() DOM direct).
  useEffect(() => {
    if (state.status === 'success' && formRef.current) {
      requestFormReset(formRef.current)
    }
  }, [state])

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4"
    >
      <h2 className="text-sm font-semibold text-slate-800">Inviter un membre</h2>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="off"
            placeholder="ex@domain.com"
            aria-invalid={!!state.fieldErrors.email}
          />
          {state.fieldErrors.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invite-role">Rôle</Label>
          <select
            id="invite-role"
            name="role"
            defaultValue={MemberRole.Viewer}
            aria-invalid={!!state.fieldErrors.role}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {INVITABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {memberRoleLabel(role)}
              </option>
            ))}
          </select>
          {state.fieldErrors.role && (
            <p className="text-xs text-destructive">{state.fieldErrors.role}</p>
          )}
        </div>

        <SubmitButton />
      </div>

      {state.rootError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.rootError}</p>
      )}

      {state.status === 'success' && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Invitation envoyée.
        </p>
      )}
    </form>
  )
}

// useFormStatus DOIT être lu dans un enfant du <form> (dans le parent il renvoie
// toujours pending: false) — d'où ce sous-composant.
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Invitation…' : 'Inviter'}
    </Button>
  )
}
