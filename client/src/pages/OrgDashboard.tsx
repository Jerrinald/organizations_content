import { Link } from '@tanstack/react-router'
import { Route as OrgRoute } from '@/routes/_authenticated/orgs/$orgId/index'
import { useCurrentOrganization } from '@/hooks/org-hooks'
import { errorMessage } from '@/lib/http-error'
import { ARTICLE_SEARCH_DEFAULTS } from '@/schemas/article'
import { Button } from '@/components/ui/button'
import EditOrganizationDialog from '@/components/EditOrganizationDialog'
import DeleteOrganizationDialog from '@/components/DeleteOrganizationDialog'

export default function OrgDashboard() {
  const { orgId } = OrgRoute.useParams()
  const { organization, isPending, isError, error } = useCurrentOrganization()

  return (
    <section className="mx-auto max-w-2xl space-y-3 p-6">
      {isPending && <p className="text-sm text-slate-500">Chargement…</p>}

      {isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(error)}
        </p>
      )}

      {!isPending && !isError && organization && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-900">{organization.name}</h1>
            <div className="flex items-center gap-2">
              <EditOrganizationDialog
                organization={organization}
                trigger={
                  <Button size="sm" variant="outline">
                    Modifier
                  </Button>
                }
              />
              <DeleteOrganizationDialog
                organization={organization}
                trigger={
                  <Button size="sm" variant="outline" className="text-destructive">
                    Supprimer
                  </Button>
                }
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">slug : {organization.slug}</p>

          <nav className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/orgs/$orgId/members"
              params={{ orgId }}
              className="text-sm text-slate-700 underline hover:text-slate-900"
            >
              Membres →
            </Link>
            <Link
              to="/orgs/$orgId/articles"
              params={{ orgId }}
              search={ARTICLE_SEARCH_DEFAULTS}
              className="text-sm text-slate-700 underline hover:text-slate-900"
            >
              Articles →
            </Link>
          </nav>
        </>
      )}

      {!isPending && !isError && !organization && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Organisation introuvable (orgId : {orgId})
        </p>
      )}

      <Link to="/dashboard" className="text-sm text-slate-700 underline hover:text-slate-900">
        ← Retour au dashboard
      </Link>
    </section>
  )
}
