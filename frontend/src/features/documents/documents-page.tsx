import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { DownloadIcon, FileTextIcon, Trash2Icon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { documentUrl } from './api'
import { DocumentPreview } from './document-preview'
import type { DocumentSummary } from './api'
import { useDeleteDocument, useDocuments } from './use-documents'

export function DocumentsPage() {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [removing, setRemoving] = useState<DocumentSummary | null>(null)
  const documents = useDocuments(search)
  const deletion = useDeleteDocument()

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <main className="flex h-full min-h-0 flex-col gap-4 overflow-hidden px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium text-accent-foreground">
          Documents
        </h1>
        <Button render={<Link to="/upload" />}>Upload documents</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Browse, preview, and manage your uploaded documents.
      </p>
      <Input
        aria-label="Search documents by title or keyword"
        placeholder="Search by title or keyword…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <section
        className="min-h-0 flex-1 space-y-3 overflow-y-auto"
        aria-live="polite"
        aria-busy={documents.isFetching}
      >
        {documents.isLoading && <p>Loading documents…</p>}
        {documents.error && (
          <div role="alert">
            <p>{documents.error.message}</p>
            <Button variant="outline" onClick={() => documents.refetch()}>
              Try again
            </Button>
          </div>
        )}
        {documents.isSuccess && documents.data.length === 0 && (
          <p className="text-muted-foreground">
            {search
              ? 'No documents match your search.'
              : 'No documents uploaded yet.'}
          </p>
        )}
        {documents.data?.map((document) => (
          <article
            key={document.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border p-4"
          >
            <FileTextIcon className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <h2 className="wrap-anywhere font-medium">{document.filename}</h2>
              <p className="text-xs text-muted-foreground">
                {document.format.toUpperCase()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DocumentPreview document={document} />
              <Button
                variant="outline"
                render={<a href={documentUrl(document.id)} />}
                aria-label={`Download ${document.filename}`}
              >
                <DownloadIcon />
                Download
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deletion.reset()
                  setRemoving(document)
                }}
                aria-label={`Delete ${document.filename}`}
              >
                <Trash2Icon />
                Delete
              </Button>
            </div>
          </article>
        ))}
      </section>
      <Dialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open && !deletion.isPending) setRemoving(null)
        }}
      >
        <DialogContent showCloseButton={!deletion.isPending}>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              “{removing?.filename}” and its search data will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          {deletion.error && (
            <p role="alert" className="text-destructive">
              {deletion.error.message}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deletion.isPending}
              onClick={() => setRemoving(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deletion.isPending}
              onClick={() => {
                if (removing)
                  deletion.mutate(removing.id, {
                    onSuccess: () => setRemoving(null),
                  })
              }}
            >
              {deletion.isPending ? 'Deleting…' : 'Delete document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
