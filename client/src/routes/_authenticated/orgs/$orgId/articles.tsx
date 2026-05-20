import { articleSearchSchema } from '@/schemas/article'
import { Outlet, createFileRoute } from '@tanstack/react-router'

// Layout pur (<Outlet />). validateSearch ici est hérité par les deux enfants
// (liste + détail).
export const Route = createFileRoute('/_authenticated/orgs/$orgId/articles')({
  validateSearch: articleSearchSchema,
  component: Outlet,
})
