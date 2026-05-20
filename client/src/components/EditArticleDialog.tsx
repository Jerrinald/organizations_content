import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateArticle, type ArticleMutationInput } from '@/hooks/article-hooks'
import { mapFieldErrors } from '@/lib/form-errors'
import {
  updateArticleSchema,
  type UpdateArticleFormValues,
} from '@/schemas/article'
import type { ArticleView } from '@/types/views'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

// Controlled-only : le parent (ArticleActionsMenu) pilote l'ouverture.
interface EditArticleDialogProps {
  orgId: string
  article: ArticleView
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditArticleDialog({
  orgId,
  article,
  open,
  onOpenChange,
}: EditArticleDialogProps) {
  const setOpen = onOpenChange
  const { updateArticle } = useUpdateArticle(orgId, article.id)

  const defaultValues: UpdateArticleFormValues = {
    title: article.title,
    content: article.content,
    slug: article.slug,
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields, isDirty },
    setError,
    reset,
  } = useForm<UpdateArticleFormValues>({
    resolver: zodResolver(updateArticleSchema),
    defaultValues,
  })

  const onSubmit = async (data: UpdateArticleFormValues) => {
    // Diff submission : ne PATCH que les champs effectivement modifiés.
    const patch: ArticleMutationInput = {}
    if (dirtyFields.title) patch.title = data.title;
    if (dirtyFields.content) patch.content = data.content;
    if (dirtyFields.slug) patch.slug = data.slug;

    try {
      await updateArticle(patch)
      reset(data)
      setOpen(false)
    } catch (err) {
      const { fieldErrors, rootError } = mapFieldErrors(err, {
        fields: ['title', 'content', 'slug'] as const,
        statusToField: { 409: 'slug' },
      })
      for (const [k, v] of Object.entries(fieldErrors)) {
        if (v) setError(k as 'title' | 'content' | 'slug', { message: v })
      }
      if (rootError) setError('root', { message: rootError })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset(defaultValues)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;article</DialogTitle>
          <DialogDescription>
            Seuls les champs modifiés seront envoyés au serveur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Titre</Label>
            <Input id="edit-title" autoComplete="off" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-slug">Slug</Label>
            <Input id="edit-slug" autoComplete="off" {...register('slug')} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-content">Contenu</Label>
            <Textarea id="edit-content" rows={8} {...register('content')} />
            {errors.content && (
              <p className="text-xs text-destructive">{errors.content.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
