import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useDeleteOrganization } from '@/hooks/org-hooks'
import { errorMessage } from '@/lib/http-error'
import type { OrganizationView } from '@/types/views'

interface DeleteOrganizationDialogProps {
  organization: OrganizationView
  trigger: React.ReactNode
}

export default function DeleteOrganizationDialog({
  organization,
  trigger,
}: DeleteOrganizationDialogProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { isPending, error, deleteOrganization, clearError } = useDeleteOrganization(
    organization.id,
  )

  const onConfirm = async (event: React.MouseEvent) => {
    event.preventDefault()
    try {
      await deleteOrganization()
      setOpen(false)
      navigate({ to: '/dashboard' })
    } catch {
      // L'erreur est exposée par le hook via `error`, déjà affichée dans le JSX.
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
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l&apos;organisation ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Toutes les données associées à{' '}
            <strong>{organization.name}</strong> (membres, articles, abonnement) seront
            supprimées.
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
