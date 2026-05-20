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
import {
  useUpdateOrganization,
  type UpdateOrganizationInput,
} from '@/hooks/org-hooks'
import {
  updateOrganizationSchema,
  type UpdateOrganizationFormValues,
} from '@/schemas/organization'
import { mapFieldErrors } from '@/lib/form-errors'
import type { OrganizationView } from '@/types/views'

interface EditOrganizationDialogProps {
  organization: OrganizationView
  trigger: React.ReactNode
}

export default function EditOrganizationDialog({
  organization,
  trigger,
}: EditOrganizationDialogProps) {
  const [open, setOpen] = useState(false)
  const { updateOrganization } = useUpdateOrganization(organization.id)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields, isDirty },
    setError,
    reset,
  } = useForm<UpdateOrganizationFormValues>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: { name: organization.name, slug: organization.slug },
  })

  const onSubmit = async (data: UpdateOrganizationFormValues) => {
    // Diff submission : ne PATCH que les champs effectivement modifiés.
    const patch: UpdateOrganizationInput = {}
    if (dirtyFields.name) patch.name = data.name
    if (dirtyFields.slug) patch.slug = data.slug

    if (Object.keys(patch).length === 0) {
      setOpen(false)
      return
    }

    try {
      await updateOrganization(patch)
      reset(data)
      setOpen(false)
    } catch (err) {
      const { fieldErrors, rootError } = mapFieldErrors(err, {
        fields: ['name', 'slug'] as const,
        statusToField: { 409: 'slug' },
      })
      for (const [k, v] of Object.entries(fieldErrors)) {
        if (v) setError(k as 'name' | 'slug', { message: v })
      }
      if (rootError) setError('root', { message: rootError })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset({ name: organization.name, slug: organization.slug })
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;organisation</DialogTitle>
          <DialogDescription>
            Modifie le nom ou le slug de l&apos;organisation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nom</Label>
            <Input id="edit-name" autoComplete="off" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-slug">Slug</Label>
            <Input id="edit-slug" autoComplete="off" {...register('slug')} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
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
