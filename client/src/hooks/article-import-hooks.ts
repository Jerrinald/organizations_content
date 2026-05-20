import { apiFetch } from '@/lib/api'
import { ArticleImportStatus, isTerminalImportStatus } from '@/types/enums'
import type { ArticleImportView } from '@/types/views'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

// Multipart : FormData construit ici, apiFetch détecte FormData et laisse le
// browser poser le Content-Type (boundary). orgId via header X-Organization-Id.
function startArticleImportRequest(file: File): Promise<ArticleImportView> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch<ArticleImportView>('/api/articles/imports', {
    method: 'POST',
    body: formData,
  })
}

function getArticleImportRequest(id: string) {
  return apiFetch<ArticleImportView>(`/api/articles/imports/${id}`)
}

// 1.5s : le handler flush ses compteurs tous les 100 articles, ça suffit pour
// voir le compteur monter sans marteler le serveur.
const POLL_INTERVAL_MS = 1500

export function articleImportStatusOptions(
  orgId: string,
  importId: string,
  initialData?: ArticleImportView,
) {
  return queryOptions({
    queryKey: ['organizations', orgId, 'imports', importId] as const,
    queryFn: () => getArticleImportRequest(importId),
    initialData,
    staleTime: 0,
    gcTime: Infinity,
    // refetchInterval renvoie false sur statut terminal → TanStack stoppe le
    // polling tout seul (pas de setInterval/useEffect manuel).
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status && isTerminalImportStatus(status)) return false
      return POLL_INTERVAL_MS
    },
  })
}

export function useArticleImportStatus(
  orgId: string,
  importId: string,
  initialData?: ArticleImportView,
) {
  const queryClient = useQueryClient()
  const query = useQuery(articleImportStatusOptions(orgId, importId, initialData))

  // useQuery n'expose pas onSuccess (retiré en v5, ≠ useMutation cf. article-hooks).
  // Au passage `success` du polling, on rafraîchit la liste articles (effect = pattern
  // reco doc v5)
  const status = query.data?.status
  useEffect(() => {
    if (status === ArticleImportStatus.Success) {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'articles'] })
    }
  }, [status, orgId, queryClient])

  return query
}

export function useStartArticleImport() {
  const mutation = useMutation({
    mutationFn: startArticleImportRequest,
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    startImport: mutation.mutateAsync,
    clearError: mutation.reset,
  }
}
