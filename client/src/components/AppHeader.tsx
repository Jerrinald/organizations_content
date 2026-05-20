import { Link } from '@tanstack/react-router'
import { useAuthStore, useUser } from '@/stores/auth-store'
import OrgSwitcher from './OrgSwitcher'

export default function AppHeader() {
  const user = useUser()
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <Link to="/dashboard" className="text-sm font-semibold text-slate-900">
        Organizations
      </Link>

      <div className="flex items-center gap-3">
        <OrgSwitcher />
        <span className="text-sm text-slate-600">{user?.email}</span>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          Se déconnecter
        </button>
      </div>
    </header>
  )
}
