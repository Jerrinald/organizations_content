import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import EditArticleDialog from '@/components/EditArticleDialog'
import DeleteArticleDialog from '@/components/DeleteArticleDialog'
import type { ArticleView } from '@/types/views'

interface ArticleActionsMenuProps {
  orgId: string
  article: ArticleView
}

type OpenDialog = 'edit' | 'delete' | null

export default function ArticleActionsMenu({ orgId, article }: ArticleActionsMenuProps) {
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)

  // Pattern Radix DropdownMenu + Dialog : on pilote l'ouverture par state plutôt
  // que d'imbriquer DialogTrigger dans un DropdownMenuItem (animations conflictuelles).
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" aria-label="Actions sur l'article">
            ⋯
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpenDialog('edit')}>
            Modifier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setOpenDialog('delete')}
            className="text-destructive focus:text-destructive"
          >
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditArticleDialog
        orgId={orgId}
        article={article}
        open={openDialog === 'edit'}
        onOpenChange={(o) => setOpenDialog(o ? 'edit' : null)}
      />
      <DeleteArticleDialog
        orgId={orgId}
        article={article}
        open={openDialog === 'delete'}
        onOpenChange={(o) => setOpenDialog(o ? 'delete' : null)}
      />
    </>
  )
}
