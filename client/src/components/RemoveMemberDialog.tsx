import { useState } from 'react'
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
import { useRemoveMember } from '@/hooks/member-hooks'
import { errorMessage } from '@/lib/http-error'
import { memberRoleLabel } from '@/types/enums'
import type { MemberView } from '@/types/views'

interface RemoveMemberDialogProps {
  orgId: string
  member: MemberView
  trigger: React.ReactNode
}

export default function RemoveMemberDialog({
  orgId,
  member,
  trigger,
}: RemoveMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const { isPending, error, removeMember, clearError } = useRemoveMember(orgId)

  const memberLabel = member.email ?? `membre ${member.id}`

  const onConfirm = async (event: React.MouseEvent) => {
    event.preventDefault()
    try {
      await removeMember(member.id)
      setOpen(false)
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
          <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{memberLabel}</strong> ({memberRoleLabel(member.role)}) perdra l&apos;accès
            à cette organisation. Cette action est immédiate.
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
            {isPending ? 'Retrait…' : 'Retirer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
