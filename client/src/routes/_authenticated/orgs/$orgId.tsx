import { createFileRoute } from '@tanstack/react-router'
import { useOrgStore } from '@/stores/org-store'

// Hydrate useOrgStore depuis l'URL (params.orgId = source de vérité). Dans
// beforeLoad pour que X-Organization-Id soit posé avant tout useQuery enfant.
export const Route = createFileRoute('/_authenticated/orgs/$orgId')({
  beforeLoad: ({ params }) => {
    useOrgStore.getState().setCurrentOrgId(params.orgId)
  },
})
