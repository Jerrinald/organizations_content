import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUpdateArticleStatus } from '@/hooks/article-hooks'
import { errorMessage } from '@/lib/http-error'
import {
  ArticleStatus,
  allowedArticleTransitions,
  articleStatusLabel,
} from '@/types/enums'
import type { ArticleView } from '@/types/views'

// Libellé verbal de l'action selon le statut cible.
const transitionLabel: Record<ArticleStatus, string> = {
  draft: 'Repasser en brouillon',
  published: 'Publier',
  archived: 'Archiver',
}

interface ArticleStatusActionsProps {
  orgId: string
  article: ArticleView
}

export default function ArticleStatusActions({ orgId, article }: ArticleStatusActionsProps) {
  const { isPending, error, updateArticleStatus, clearError } = useUpdateArticleStatus(
    orgId,
    article.id,
  )
  const transitions = allowedArticleTransitions(article.status)

  const handleTransition = async (next: ArticleStatus) => {
    clearError()
    try {
      await updateArticleStatus(next)
    } catch {
      // erreur exposée via le hook (error)
    }
  }

  // Safe si l'enum évolue vers un statut sans transition sortante.
  if (transitions.length === 0) return null

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={isPending}>
            {isPending ? 'Changement…' : 'Statut'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            Actuel : {articleStatusLabel(article.status)}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {transitions.map((target) => (
            <DropdownMenuItem key={target} onSelect={() => handleTransition(target)}>
              {transitionLabel[target]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <p className="text-xs text-destructive">
          {errorMessage(error)}
        </p>
      )}
    </div>
  )
}
