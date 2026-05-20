import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteArticle } from '@/hooks/article-hooks'
import { errorMessage } from '@/lib/http-error'
import type { ArticleView } from '@/types/views'

// Controlled-only : le parent (ArticleActionsMenu) pilote l'ouverture.
interface DeleteArticleDialogProps {
  orgId: string
  article: ArticleView
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DeleteArticleDialog({
  orgId,
  article,
  open,
  onOpenChange,
}: DeleteArticleDialogProps) {
  const setOpen = onOpenChange
  const { isPending, error, deleteArticle, clearError } = useDeleteArticle(
    orgId,
    article.id,
  )

  // preventDefault : empêche AlertDialogAction de fermer le dialog avant la fin
  // de la requête → on peut afficher l'erreur en cas d'échec.
  const onConfirm = async (event: React.MouseEvent) => {
    event.preventDefault()
    try {
      await deleteArticle()
      setOpen(false)
    } catch {
      // erreur exposée via le hook (error)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) clearError()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l&apos;article ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. <strong>{article.title}</strong> sera
            définitivement supprimé.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage(error)}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? 'Suppression…' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
