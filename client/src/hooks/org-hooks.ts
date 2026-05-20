// Convention queryKey hiérarchique du projet :
//   ['organizations', 'list']                  → mes orgs
//   ['organizations', orgId]                    → tout ce qui concerne une org
//   ['organizations', orgId, 'articles' | 'members' | 'imports', ...]
// Invalider/purger ['organizations', orgId] cascade sur tous les sous-scopes.

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { apiFetch } from '@/lib/api'
import { useCurrentOrgId, useOrgStore } from '@/stores/org-store'
import type { OrganizationView } from '@/types/views'

export interface CreateOrganizationInput {
  name: string
  slug: string
}

export interface UpdateOrganizationInput {
  name?: string
  slug?: string
  settings?: Record<string, unknown>
}

// skipOrganization sur tous les endpoints orgs : on cible l'API par URL, pas via
// le scope X-Organization-Id courant (création = pas d'org courante, etc.).

function createOrganizationRequest(input: CreateOrganizationInput) {
  return apiFetch<OrganizationView>('/api/organizations', {
    method: 'POST',
    body: input,
    skipOrganization: true,
  })
}

function updateOrganizationRequest(id: string, input: UpdateOrganizationInput) {
  return apiFetch<OrganizationView>(`/api/organizations/${id}`, {
    method: 'PATCH',
    body: input,
    skipOrganization: true,
  })
}

function deleteOrganizationRequest(id: string) {
  return apiFetch<void>(`/api/organizations/${id}`, {
    method: 'DELETE',
    skipOrganization: true,
  })
}

export function organizationsListOptions() {
  return queryOptions({
    queryKey: ['organizations', 'list'] as const,
    queryFn: () =>
      apiFetch<OrganizationView[]>('/api/organizations', { skipOrganization: true }),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useOrganizationsList() {
  return useQuery(organizationsListOptions())
}

interface UseCurrentOrganizationResult {
  /** undefined tant que la liste charge, ou si aucune org sélectionnée, ou si l'orgId courant n'existe pas dans la liste. */
  organization: OrganizationView | undefined
  currentOrgId: string | null
  isPending: boolean
  isError: boolean
  error: Error | null
}

// Dérive l'OrganizationView depuis currentOrgId (store) + liste cachée — pas de
// fetch dédié /{id} puisque la liste est déjà en cache (gcTime: Infinity).
export function useCurrentOrganization(): UseCurrentOrganizationResult {
  const currentOrgId = useCurrentOrgId()
  const { data, isPending, isError, error } = useOrganizationsList()

  const organization = currentOrgId ? data?.find((org) => org.id === currentOrgId) : undefined

  return { organization, currentOrgId, isPending, isError, error }
}

// removeQueries (pas invalidateQueries) pour vider net le cache de l'ancienne org
// : évite un flicker de ses données pendant le refetch après le switch.
export function useSwitchOrganization() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return (newOrgId: string) => {
    const oldOrgId = useOrgStore.getState().currentOrgId
    if (oldOrgId === newOrgId) return

    if (oldOrgId) {
      queryClient.removeQueries({ queryKey: ['organizations', oldOrgId] })
    }

    useOrgStore.getState().setCurrentOrgId(newOrgId)
    navigate({ to: '/orgs/$orgId', params: { orgId: newOrgId } })
  }
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createOrganizationRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['organizations', 'list'] }),
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    createOrganization: mutation.mutateAsync,
    clearError: mutation.reset,
  }
}

export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganizationRequest(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['organizations', 'list'] }),
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    updateOrganization: mutation.mutateAsync,
    clearError: mutation.reset,
  }
}

export function useDeleteOrganization(id: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => deleteOrganizationRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', 'list'] })
      queryClient.removeQueries({ queryKey: ['organizations', id] })
      // Si on supprime l'org courante, vider le store pour ne pas envoyer un
      // X-Organization-Id supprimé après le navigate.
      if (useOrgStore.getState().currentOrgId === id) {
        useOrgStore.getState().clear()
      }
    },
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    deleteOrganization: mutation.mutateAsync,
    clearError: mutation.reset,
  }
}
