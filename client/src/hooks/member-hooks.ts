import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { InvitableRole } from '@/types/enums'
import type { MemberView } from '@/types/views'

// Owner exclu côté backend (Choice Admin/Editor/Viewer). InvitableRole + la
// valeur runtime INVITABLE_ROLES vivent dans types/enums.ts (source unique).
export interface InviteMemberInput {
  email: string
  role: InvitableRole
}

// orgId dans l'URL (MapEntity côté controller) ; X-Organization-Id est injecté en
// plus par apiFetch mais c'est l'URL qui fait foi.

function listMembersRequest(orgId: string) {
  return apiFetch<MemberView[]>(`/api/organizations/${orgId}/members`)
}

function inviteMemberRequest(orgId: string, input: InviteMemberInput) {
  return apiFetch<MemberView>(`/api/organizations/${orgId}/members`, {
    method: 'POST',
    body: input,
  })
}

function removeMemberRequest(orgId: string, memberId: string) {
  return apiFetch<void>(`/api/organizations/${orgId}/members/${memberId}`, {
    method: 'DELETE',
  })
}

export function membersListOptions(orgId: string) {
  return queryOptions({
    queryKey: ['organizations', orgId, 'members'] as const,
    queryFn: () => listMembersRequest(orgId),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useMembersList(orgId: string) {
  return useQuery(membersListOptions(orgId))
}

export function useInviteMember(orgId: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: InviteMemberInput) => inviteMemberRequest(orgId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] }),
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    inviteMember: mutation.mutateAsync,
    clearError: mutation.reset,
  }
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (memberId: string) => removeMemberRequest(orgId, memberId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] }),
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    removeMember: mutation.mutateAsync,
    clearError: mutation.reset,
  }
}
