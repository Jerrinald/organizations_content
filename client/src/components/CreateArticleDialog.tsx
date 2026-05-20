import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateArticle } from '@/hooks/article-hooks'
import {
  createArticleSchema,
  type CreateArticleFormValues,
  type CreateArticleParsed,
} from '@/schemas/article'
import { mapFieldErrors } from '@/lib/form-errors'

interface CreateArticleDialogProps {
  orgId: string
  trigger: React.ReactNode
}

export default function CreateArticleDialog({ orgId, trigger }: CreateArticleDialogProps) {
  const [open, setOpen] = useState(false)
  const { createArticle } = useCreateArticle(orgId)

  // RHF typé AVANT transform (slug = '') ; le resolver expose les valeurs APRÈS
  // transform (slug?) au onSubmit.
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<CreateArticleFormValues, unknown, CreateArticleParsed>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: { title: '', content: '', slug: '' },
  })

  const onSubmit = async (data: CreateArticleParsed) => {
    try {
      await createArticle(data)
      reset()
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
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel article</DialogTitle>
          <DialogDescription>
            L&apos;article sera créé en statut <em>Brouillon</em>. Tu pourras le publier ensuite.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" autoComplete="off" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (optionnel)</Label>
            <Input
              id="slug"
              autoComplete="off"
              placeholder="auto-généré depuis le titre si vide"
              {...register('slug')}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            <p className="text-xs text-muted-foreground">
              Identifiant URL — minuscules, chiffres et tirets uniquement.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content">Contenu</Label>
            <Textarea id="content" rows={8} {...register('content')} />
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Création…' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
