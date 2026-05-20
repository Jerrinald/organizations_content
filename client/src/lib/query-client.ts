import { QueryClient } from '@tanstack/react-query'

// Defaults globaux (filet de sécurité). Chaque queryOptions() positionne son
// propre staleTime : Infinity pour les données purement CRUD (orgs/members),
// 30s pour celles modifiables côté serveur (articles), 0 + refetchInterval pour
// le polling (import).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
