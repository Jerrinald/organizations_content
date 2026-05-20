import OrgMembers from '@/pages/OrgMembers'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/orgs/$orgId/members')({
  component: OrgMembers,
})