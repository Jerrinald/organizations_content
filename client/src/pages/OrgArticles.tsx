import ArticleActionsMenu from '@/components/ArticleActionsMenu'
import ArticleStatusActions from '@/components/ArticleStatusActions'
import CreateArticleDialog from '@/components/CreateArticleDialog'
import ImportArticlesDialog from '@/components/ImportArticlesDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useArticlesList } from '@/hooks/article-hooks'
import { errorMessage } from '@/lib/http-error'
import { Route as ArticlesRoute } from '@/routes/_authenticated/orgs/$orgId/articles'
import { ArticleStatus, articleStatusLabel } from '@/types/enums'
import { Link, useNavigate } from '@tanstack/react-router'
import { useDeferredValue, useState } from 'react'

// Source unique pour le <select> de filtre — l'ordre est celui qu'on veut afficher.
const FILTERABLE_STATUSES = [
  ArticleStatus.Draft,
  ArticleStatus.Published,
  ArticleStatus.Archived,
] as const

const statusBadgeClass: Record<ArticleStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-amber-100 text-amber-800',
}

export default function OrgArticles() {
  const { orgId } = ArticlesRoute.useParams()
  const { page, limit, status } = ArticlesRoute.useSearch()
  const navigate = useNavigate()
  const { data, isPending, isError, error, isFetching, isPlaceholderData } = useArticlesList(
    orgId,
    { page, limit, status },
  )

  // Recherche texte client-side, page courante seulement (pas d'endpoint search).
  // `search` synchrone (frappe fluide) + useDeferredValue pour le filtrage (React
  // peut l'interrompre). Hors URL pour ne pas polluer l'historique à chaque touche.
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const isStaleFilter = search !== deferredSearch

  const filteredData =
    data && deferredSearch.trim() !== ''
      ? data.filter((article) => article.title.toLowerCase().includes(deferredSearch.toLowerCase()))
      : data

  // Reset page à 1 ; '' = "Tous" → status undefined (absent de l'URL).
  function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value === '' ? undefined : (event.target.value as ArticleStatus)
    navigate({
      to: '/orgs/$orgId/articles',
      params: { orgId },
      search: { page: 1, limit, status: next },
    })
  }

  // Pas de totalCount backend → on infère la dernière page (moins d'items que
  // demandé). isPlaceholderData désactive Next pendant un fetch (keepPreviousData).
  const isLastPage = !!data && data.length < limit
  const canPrev = page > 1
  const canNext = !!data && !isLastPage && !isPlaceholderData

  return (
    <section className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Articles</h1>
        <div className="flex items-center gap-3">
          <ImportArticlesDialog
            orgId={orgId}
            trigger={
              <Button size="sm" variant="outline">
                Importer
              </Button>
            }
          />
          <CreateArticleDialog
            orgId={orgId}
            trigger={<Button size="sm">+ Créer</Button>}
          />
          <Link
            to="/orgs/$orgId"
            params={{ orgId }}
            className="text-sm text-slate-700 underline hover:text-slate-900"
          >
            ← Retour à l&apos;organisation
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="filter-status" className="text-sm text-slate-700">
            Statut :
          </label>
          <select
            id="filter-status"
            value={status ?? ''}
            onChange={handleStatusChange}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Tous</option>
            {FILTERABLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {articleStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 items-center gap-2">
          <label htmlFor="filter-search" className="text-sm text-slate-700">
            Rechercher :
          </label>
          <Input
            id="filter-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Titre (page courante uniquement)"
            className="h-8"
          />
        </div>
      </div>

      {isPending && <p className="text-sm text-slate-500">Chargement…</p>}

      {isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(error)}
        </p>
      )}

      {!isPending && !isError && data && data.length === 0 && (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {page > 1 ? 'Cette page est vide.' : "Aucun article pour l'instant."}
        </p>
      )}

      {!isPending &&
        !isError &&
        data &&
        data.length > 0 &&
        filteredData &&
        filteredData.length === 0 && (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Aucun résultat pour « {deferredSearch} » sur la page {page}.
          </p>
        )}

      {!isPending && !isError && filteredData && filteredData.length > 0 && (
        <ul
          className={
            'divide-y divide-slate-200 rounded-md border border-slate-200 transition-opacity ' +
            (isStaleFilter ? 'opacity-60' : '')
          }
        >
          {filteredData.map((article) => (
            <li
              key={article.id}
              className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50"
            >
              {/* Link couvre la zone info ; les dropdowns sont siblings (évite
                  l'imbrication <a><button> invalide). */}
              <Link
                to="/orgs/$orgId/articles/$articleId"
                params={{ orgId, articleId: article.id }}
                search={{ page, limit, status }}
                className="flex min-w-0 flex-1 items-center gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{article.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(article.createdAt).toLocaleDateString('fr-FR')}
                    {' · '}
                    <span className="font-mono">{article.slug}</span>
                  </p>
                </div>
                <span
                  className={
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                    statusBadgeClass[article.status]
                  }
                >
                  {articleStatusLabel(article.status)}
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <ArticleStatusActions orgId={orgId} article={article} />
                <ArticleActionsMenu orgId={orgId} article={article} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isPending && !isError && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            aria-disabled={!canPrev}
            tabIndex={canPrev ? undefined : -1}
          >
            <Link
              to="/orgs/$orgId/articles"
              params={{ orgId }}
              search={{ page: page - 1, limit, status }}
            >
              ← Précédent
            </Link>
          </Button>

          <p className="text-xs text-slate-500">
            Page {page}
            {isFetching && <span className="ml-2 italic">(mise à jour…)</span>}
          </p>

          <Button
            asChild
            size="sm"
            variant="outline"
            aria-disabled={!canNext}
            tabIndex={canNext ? undefined : -1}
          >
            <Link
              to="/orgs/$orgId/articles"
              params={{ orgId }}
              search={{ page: page + 1, limit, status }}
            >
              Suivant →
            </Link>
          </Button>
        </div>
      )}
    </section>
  )
}
