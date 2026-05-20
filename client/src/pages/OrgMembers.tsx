import { useOptimistic } from 'react'
import { Link } from '@tanstack/react-router'
import { Route as MembersRoute } from '@/routes/_authenticated/orgs/$orgId/members'
import { useInviteMember, useMembersList, type InviteMemberInput } from '@/hooks/member-hooks'
import { errorMessage } from '@/lib/http-error'
import { MemberRole, memberRoleLabel } from '@/types/enums'
import type { MemberView } from '@/types/views'
import { Button } from '@/components/ui/button'
import RemoveMemberDialog from '@/components/RemoveMemberDialog'
import InviteMemberForm from '@/components/InviteMemberForm'

// MemberView + flag de rendu optimiste (purement UI, disparaît au rebase serveur).
type DisplayMember = MemberView & { pending?: boolean }

function makeOptimisticMember(input: InviteMemberInput): DisplayMember {
  return {
    id: `optimistic-${input.email}`,
    userId: '',
    email: input.email,
    role: input.role,
    invitedAt: new Date().toISOString(),
    joinedAt: null,
    pending: true,
  }
}

export default function OrgMembers() {
  const { orgId } = MembersRoute.useParams()
  const { data, isPending, isError, error } = useMembersList(orgId)
  const { inviteMember } = useInviteMember(orgId)

  // Rebasé sur `data ?? []` à chaque rendu : au succès (invalidate) ou à l'échec
  // (throw), l'optimiste disparaît tout seul — pas de rollback manuel.
  const [optimisticMembers, addOptimistic] = useOptimistic<DisplayMember[], InviteMemberInput>(
    data ?? [],
    (state, input) => [...state, makeOptimisticMember(input)],
  )

  // addOptimistic doit être appelé DANS la transition (l'action useActionState du
  // form). Le throw remonte au form pour mapFieldErrors.
  async function inviteWithOptimistic(input: InviteMemberInput) {
    addOptimistic(input)
    await inviteMember(input)
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Membres</h1>
        <Link
          to="/orgs/$orgId"
          params={{ orgId }}
          className="text-sm text-slate-700 underline hover:text-slate-900"
        >
          ← Retour à l&apos;organisation
        </Link>
      </div>

      <InviteMemberForm onInvite={inviteWithOptimistic} />

      {isPending && <p className="text-sm text-slate-500">Chargement…</p>}

      {isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(error)}
        </p>
      )}

      {!isPending && !isError && optimisticMembers.length === 0 && (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Aucun membre pour l&apos;instant.
        </p>
      )}

      {!isPending && !isError && optimisticMembers.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
          {optimisticMembers.map((member) => (
            <li
              key={member.id}
              className={
                'flex items-center justify-between gap-4 px-4 py-3 ' +
                (member.pending ? 'opacity-60' : '')
              }
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {member.email ?? <span className="italic text-slate-400">— sans email</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {memberRoleLabel(member.role)}
                  {' · '}
                  {member.pending
                    ? 'Envoi…'
                    : member.joinedAt
                      ? `Membre depuis ${new Date(member.joinedAt).toLocaleDateString('fr-FR')}`
                      : 'Invitation en attente'}
                </p>
              </div>

              {!member.pending && member.role !== MemberRole.Owner && (
                <RemoveMemberDialog
                  orgId={orgId}
                  member={member}
                  trigger={
                    <Button size="sm" variant="outline" className="text-destructive">
                      Retirer
                    </Button>
                  }
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
