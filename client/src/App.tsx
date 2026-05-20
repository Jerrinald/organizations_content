import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { router } from './router'
import { queryClient } from './lib/query-client'
import { useIsAuthenticated } from './stores/auth-store'

export default function App() {
  const isAuthenticated = useIsAuthenticated()
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ auth: { isAuthenticated } }} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
