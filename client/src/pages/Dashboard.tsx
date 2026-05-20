import { Link } from '@tanstack/react-router'
import { useOrganizationsList } from '@/hooks/org-hooks'
import { errorMessage } from '@/lib/http-error'
import { Button } from '@/components/ui/button'
import CreateOrganizationDialog from '@/components/CreateOrganizationDialog'

export default function Dashboard() {
  const { data, isPending, isError, error } = useOrganizationsList()

  return (
    <section className="mx-auto max-w-2xl space-y-3 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Vos organisations</h2>
        <CreateOrganizationDialog trigger={<Button size="sm">+ Créer</Button>} />
      </div>

      {isPending && <p className="text-sm text-slate-500">Chargement…</p>}

      {isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(error)}
        </p>
      )}

      {data && data.length === 0 && (
        <p className="text-sm text-slate-500">Aucune organisation pour l&apos;instant.</p>
      )}

      {data && data.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
          {data.map((org) => (
            <li key={org.id}>
              <Link
                to="/orgs/$orgId"
                params={{ orgId: org.id }}
                className="block px-4 py-3 text-sm hover:bg-slate-50"
              >
                <div className="font-medium text-slate-900">{org.name}</div>
                <div className="text-xs text-slate-500">{org.slug}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
