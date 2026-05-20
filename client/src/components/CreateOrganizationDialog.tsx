import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
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
import { useCreateOrganization } from '@/hooks/org-hooks'
import {
  createOrganizationSchema,
  type CreateOrganizationFormValues,
} from '@/schemas/organization'
import { mapFieldErrors } from '@/lib/form-errors'

interface CreateOrganizationDialogProps {
  trigger: React.ReactNode
}

export default function CreateOrganizationDialog({ trigger }: CreateOrganizationDialogProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { createOrganization } = useCreateOrganization()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
  })

  const onSubmit = async (data: CreateOrganizationFormValues) => {
    try {
      const created = await createOrganization(data)
      reset()
      setOpen(false)
      navigate({ to: '/orgs/$orgId', params: { orgId: created.id } })
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
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une organisation</DialogTitle>
          <DialogDescription>
            Tu deviendras automatiquement owner de cette nouvelle organisation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" autoComplete="off" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              autoComplete="off"
              placeholder="ma-super-org"
              {...register('slug')}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            <p className="text-xs text-muted-foreground">
              Identifiant URL — minuscules, chiffres et tirets uniquement.
            </p>
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
