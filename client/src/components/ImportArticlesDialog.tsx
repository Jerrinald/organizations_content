import { useState, type ReactNode } from 'react'
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
  useArticleImportStatus,
  useStartArticleImport,
} from '@/hooks/article-import-hooks'
import { errorMessage } from '@/lib/http-error'
import {
  ArticleImportStatus,
  articleImportStatusLabel,
  isTerminalImportStatus,
} from '@/types/enums'
import type { ArticleImportView } from '@/types/views'
import { Loader2Icon } from 'lucide-react'

interface ImportArticlesDialogProps {
  orgId: string
  trigger: ReactNode
}

export default function ImportArticlesDialog({ orgId, trigger }: ImportArticlesDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ArticleImportView | null>(null)
  const { isPending, error, startImport, clearError } = useStartArticleImport()

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
    clearError()
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return
    try {
      const created = await startImport(file)
      setResult(created)
    } catch {
      // erreur exposée via le hook (error)
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setFile(null)
      setResult(null)
      clearError()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer des articles</DialogTitle>
          <DialogDescription>
            Téléverse un fichier JSON contenant un tableau d&apos;articles au format{' '}
            <code className="text-xs">{'{ title, content, slug? }'}</code>.
          </DialogDescription>
        </DialogHeader>

        {result === null ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-file">Fichier JSON</Label>
              <Input
                id="import-file"
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
                required
              />
              {file && (
                <p className="text-xs text-muted-foreground">
                  {file.name} — {(file.size / 1024).toFixed(1)} Ko
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage(error)}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={!file || isPending}>
                {isPending ? 'Envoi…' : "Lancer l'import"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <ImportStatusPanel
            orgId={orgId}
            initial={result}
            onClose={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// Extrait pour n'appeler useArticleImportStatus qu'avec un importId (post-202) :
// un hook ne peut pas être conditionnel. Le polling vit le temps du montage —
// fermer le dialog l'arrête (l'import continue côté backend).
function ImportStatusPanel({
  orgId,
  initial,
  onClose,
}: {
  orgId: string
  initial: ArticleImportView
  onClose: () => void
}) {
  // initial (vue 202 queued) passée en initialData → économise le premier fetch.
  const { data, isError, error } = useArticleImportStatus(orgId, initial.id, initial)

  // `?? initial` : initialData rend `data` non-undefined au runtime mais le typing
  // v5 ne le reflète pas.
  const view = data ?? initial
  const isTerminal = isTerminalImportStatus(view.status)
  const isSuccess = view.status === ArticleImportStatus.Success
  const isFailed = view.status === ArticleImportStatus.Failed
  const totalProcessed = view.importedCount + view.skippedCount

  return (
    <div className="space-y-3">
      <div
        aria-live="polite"
        className={
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm ' +
          (isSuccess
            ? 'bg-emerald-50 text-emerald-800'
            : isFailed
              ? 'bg-red-50 text-red-700'
              : 'bg-slate-50 text-slate-700')
        }
      >
        {!isTerminal && <Loader2Icon className="size-4 shrink-0 animate-spin" aria-hidden />}
        <span>
          Statut : <strong>{articleImportStatusLabel(view.status)}</strong>
        </span>
      </div>

      {/* Barre indéterminée : le backend n'expose pas de total → on signale
          l'activité (pulse) sans prétendre à un %, pleine et colorée une fois terminé. */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={
            'h-full w-full rounded-full transition-colors ' +
            (isSuccess
              ? 'bg-emerald-500'
              : isFailed
                ? 'bg-red-500'
                : 'animate-pulse bg-slate-300')
          }
        />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-slate-200 px-3 py-2">
          <dt className="text-xs text-slate-500">Articles importés</dt>
          <dd className="text-lg font-semibold text-slate-900">{view.importedCount}</dd>
        </div>
        <div className="rounded-md border border-slate-200 px-3 py-2">
          <dt className="text-xs text-slate-500">Articles ignorés</dt>
          <dd className="text-lg font-semibold text-slate-900">{view.skippedCount}</dd>
        </div>
      </dl>

      <p className="text-xs text-slate-500">Total traité : {totalProcessed}</p>

      {isFailed && (
        <p className="text-xs text-muted-foreground">
          L&apos;import a échoué. Voir les logs serveur côté worker pour le détail.
        </p>
      )}

      {isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(error)}
        </p>
      )}

      <p className="font-mono text-xs text-slate-400">{view.id}</p>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {isTerminal ? 'Fermer' : 'Fermer (l’import continue en arrière-plan)'}
        </Button>
      </DialogFooter>
    </div>
  )
}
