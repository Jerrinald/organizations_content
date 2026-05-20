import { apiFetch } from '@/lib/api'
import type { ArticleSearch } from '@/schemas/article'
import type { ArticleStatus } from '@/types/enums'
import type { ArticleView } from '@/types/views'
import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

// Forme partagée Create/Update côté HTTP. Tous les champs optionnels au niveau du
// type ; Update est un vrai PATCH (seuls les champs modifiés sont envoyés).
export interface ArticleMutationInput {
  title?: string
  content?: string
  slug?: string
}

// L'orgId n'est pas dans l'URL : le backend scope via le header X-Organization-Id
// (injecté par apiFetch).

function listArticlesRequest({ page, limit, status }: ArticleSearch) {
  const querySearch = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) querySearch.set('status', status)
  return apiFetch<ArticleView[]>(`/api/articles?${querySearch.toString()}`)
}

function getArticleRequest(id: string) {
  return apiFetch<ArticleView>(`/api/articles/${id}`)
}

function createArticleRequest(input: ArticleMutationInput) {
  return apiFetch<ArticleView>('/api/articles', { method: 'POST', body: input })
}

function updateArticleRequest(id: string, input: ArticleMutationInput) {
  return apiFetch<ArticleView>(`/api/articles/${id}`, { method: 'PATCH', body: input })
}

function updateArticleStatusRequest(id: string, status: ArticleStatus) {
  return apiFetch<ArticleView>(`/api/articles/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

function deleteArticleRequest(id: string) {
  return apiFetch<void>(`/api/articles/${id}`, { method: 'DELETE' })
}

export function articlesListOptions(orgId: string, params: ArticleSearch) {
  return queryOptions({
    queryKey: ['organizations', orgId, 'articles', params] as const,
    queryFn: () => listArticlesRequest(params),
    // staleTime 30s (vs Infinity orgs/members) : un article peut être édité par
    // un autre membre, le stale-while-revalidate a du sens.
    staleTime: 30 * 1000,
    gcTime: Infinity,
    // Pas de flash blanc au changement de page : on garde le rendu précédent
    // pendant le fetch (isFetching sert d'indicateur subtil).
    placeholderData: keepPreviousData,
  })
}

export function useArticlesList(orgId: string, params: ArticleSearch) {
  return useQuery(articlesListOptions(orgId, params))
}

export function articleDetailOptions(orgId: string, id: string) {
  return queryOptions({
    queryKey: ['organizations', orgId, 'articles', 'detail', id] as const,
    queryFn: () => getArticleRequest(id),
    staleTime: 30 * 1000,
    gcTime: Infinity,
  })
}

export function useArticle(orgId: string, id: string) {
  return useQuery(articleDetailOptions(orgId, id))
}

// Les mutations invalident par préfixe ['organizations', orgId, 'articles'] :
// TanStack matche toutes les pages/filtres montés et les refetch.

export function useCreateArticle(orgId: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createArticleRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'articles'] }),
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    createArticle: mutation.mutateAsync,
    clearError: mutation.reset,
  }
}

export function useUpdateArticle(orgId: string, id: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: ArticleMutationInput) => updateArticleRequest(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'articles'] }),
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    updateArticle: mutation.mutateAsync,
    clearError: mutation.reset,
  }
}

// On filtre les boutons via allowedArticleTransitions(from) côté UI ; le 409
// (transition invalide) ne devrait donc arriver qu'en cas d'état périmé (2 onglets).
export function useUpdateArticleStatus(orgId: string, id: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (status: ArticleStatus) => updateArticleStatusRequest(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'articles'] }),
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    updateArticleStatus: mutation.mutateAsync,
    clearError: mutation.reset,
  }
}

export function useDeleteArticle(orgId: string, id: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => deleteArticleRequest(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'articles'] }),
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    deleteArticle: mutation.mutateAsync,
    clearError: mutation.reset,
  }
}
