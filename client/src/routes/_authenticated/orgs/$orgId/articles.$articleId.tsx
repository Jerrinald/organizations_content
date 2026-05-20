import OrgArticleDetail from '@/pages/OrgArticleDetail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/orgs/$orgId/articles/$articleId')({
  component: OrgArticleDetail,
})
