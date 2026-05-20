import { Link } from '@tanstack/react-router'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 p-4">
      <h1 className="text-3xl font-semibold text-slate-900">organizations-content</h1>
      <p className="max-w-md text-center text-slate-600">
        Plateforme multi-tenant de gestion de contenu par organisation.
      </p>
      <Link
        to="/login"
        className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Se connecter
      </Link>
    </main>
  )
}
