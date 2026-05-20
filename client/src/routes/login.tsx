import { createFileRoute, redirect } from '@tanstack/react-router'
import Login from '@/pages/Login'

export const Route = createFileRoute('/login')({
  validateSearch: (search): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: Login,
})
