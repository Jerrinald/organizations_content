import OrgArticles from '@/pages/OrgArticles'
import { createFileRoute } from '@tanstack/react-router'

// /orgs/$orgId/articles → la liste (validateSearch hérité du parent articles.tsx).
export const Route = createFileRoute('/_authenticated/orgs/$orgId/articles/')({
  component: OrgArticles,
})
