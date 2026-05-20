import { useArticle } from '@/hooks/article-hooks'
import { errorMessage } from '@/lib/http-error'
import { Route as ArticleDetailRoute } from '@/routes/_authenticated/orgs/$orgId/articles.$articleId'
import { ArticleStatus, articleStatusLabel } from '@/types/enums'
import { Link } from '@tanstack/react-router'

const statusBadgeClass: Record<ArticleStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-amber-100 text-amber-800',
}

export default function OrgArticleDetail() {
  const { orgId, articleId } = ArticleDetailRoute.useParams()
  const { data: article, isPending, isError, error } = useArticle(orgId, articleId)

  return (
    <section className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        to="/orgs/$orgId/articles"
        params={{ orgId }}
        search={{ page: 1, limit: 20 }}
        className="text-sm text-slate-700 underline hover:text-slate-900"
      >
        ← Retour à la liste
      </Link>

      {isPending && <p className="text-sm text-slate-500">Chargement…</p>}

      {isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(error)}
        </p>
      )}

      {!isPending && !isError && article && (
        <article className="space-y-4">
          <header className="space-y-2 border-b border-slate-200 pb-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-slate-900">{article.title}</h1>
              <span
                className={
                  'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                  statusBadgeClass[article.status]
                }
              >
                {articleStatusLabel(article.status)}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              <span className="font-mono">{article.slug}</span>
              {' · '}
              Créé le {new Date(article.createdAt).toLocaleDateString('fr-FR')}
              {article.publishedAt && (
                <>
                  {' · '}
                  Publié le {new Date(article.publishedAt).toLocaleDateString('fr-FR')}
                </>
              )}
            </p>
          </header>

          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {article.content}
          </div>
        </article>
      )}
    </section>
  )
}
