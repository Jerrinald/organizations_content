import { Outlet } from '@tanstack/react-router'
import AppHeader from '@/components/AppHeader'

export default function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <Outlet />
    </div>
  )
}
