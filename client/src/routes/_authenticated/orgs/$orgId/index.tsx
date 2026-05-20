import { createFileRoute } from '@tanstack/react-router'
import OrgDashboard from '@/pages/OrgDashboard'

export const Route = createFileRoute('/_authenticated/orgs/$orgId/')({
  component: OrgDashboard,
})
