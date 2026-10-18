import { useRef, useState } from 'react'
import { FileTextIcon, LoaderCircleIcon, UploadIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '#/components/ui/dialog'
import { useUpload } from './use-upload'
import { cn } from '#/lib/utils'

function scorePosition(score: number) {
  return `${(Math.max(-1, Math.min(1, score)) + 1) * 50}%`
}
export function UploadPage() {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const mutation = useUpload()
  const uploading = mutation.isPending
  const result = mutation.data
  const [validationError, setError] = useState('')
  const error = validationError || mutation.error?.message
  const [resultOpen, setResultOpen] = useState(false)

  function selectFiles(files: FileList) {
    setDragging(false)
    mutation.reset()
    setError('')
    if (files.length !== 1) {
      setError('Please choose one document at a time.')
      return
    }
    const selected = files[0]
    if (!/\.(pdf|txt)$/i.test(selected.name)) {
      setError('Please choose a PDF or TXT file.')
      return
    }
    if (selected.size === 0) {
      setError('This file is empty. Please choose another document.')
      return
    }
    setFile(selected)
  }

  function upload() {
    if (!file || uploading) return
    setError('')
    mutation.mutate(file, { onSuccess: () => setResultOpen(true) })
  }

  return (
    <main className="flex h-full flex-col items-center overflow-y-auto px-6 py-12 sm:justify-center sm:px-10">
      <div className="flex w-full max-w-lg shrink-0 flex-col gap-8">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-medium text-accent-foreground">
            Upload a document
          </h1>
          <p className="text-sm text-muted-foreground">
            Add a document to the collection.
          </p>
        </header>
        <div className="h-80">
          {!file && (
            <section
              aria-label="Document upload"
              aria-busy={uploading}
              className={cn(
                'flex h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-6 text-center transition-colors',
                dragging && 'border-primary bg-accent/40',
              )}
              onDragOver={(event) => {
                event.preventDefault()
                if (!uploading) setDragging(true)
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                )
                  setDragging(false)
              }}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                if (!uploading) selectFiles(event.dataTransfer.files)
              }}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <UploadIcon className="size-5" aria-hidden="true" />
              </div>
              <p className="font-medium text-accent-foreground">
                {dragging
                  ? 'Drop the document here'
                  : 'Drag a document here to upload'}
              </p>
              <p className="text-sm text-muted-foreground">PDF or TXT</p>
              <input
                ref={input}
                type="file"
                accept=".pdf,.txt"
                aria-label="Choose a document"
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  if (event.target.files?.length)
                    selectFiles(event.target.files)
                  event.target.value = ''
                }}
              />
              <Button
                variant="outline"
                className="mt-2 w-fit px-5"
                disabled={uploading}
                onClick={() => input.current?.click()}
              >
                Choose file
              </Button>
            </section>
          )}
          {file && (
            <div className="flex h-80 flex-col items-center justify-center gap-6 rounded-2xl border bg-card p-6 text-center">
              <div className="flex w-full min-w-0 flex-col items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <FileTextIcon className="size-5" aria-hidden="true" />
                </div>
                <div className="w-full min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground" role="status">
                    {file.name.split('.').pop()?.toUpperCase()} ·{' '}
                    {file.size < 1024 * 1024
                      ? `${Math.ceil(file.size / 1024)} KB`
                      : `${(file.size / 1024 / 1024).toFixed(1)} MB`}{' '}
                    {uploading && ' · Uploading and processing…'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="ghost"
                  className="w-fit px-3"
                  disabled={uploading}
                  onClick={() => {
                    setFile(null)
                    setError('')
                    mutation.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="w-fit px-4"
                  disabled={uploading}
                  onClick={upload}
                >
                  {uploading ? (
                    <LoaderCircleIcon
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <UploadIcon aria-hidden="true" />
                  )}
                  {uploading ? 'Uploading…' : 'Upload document'}
                </Button>
              </div>
            </div>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Dialog
        open={resultOpen}
        onOpenChange={(open) => {
          setResultOpen(open)
          if (!open) setFile(null)
        }}
      >
        <DialogContent>
          {result && (
            <>
              <DialogHeader className="pr-8">
                <DialogTitle>
                  {result.accepted ? 'Document added' : 'Document not added'}
                </DialogTitle>
                <DialogDescription>
                  {result.accepted
                    ? 'The document meets the relevance threshold and is ready to search.'
                    : 'The document is below the relevance threshold and was not added to the collection.'}
                </DialogDescription>
              </DialogHeader>
              <p className="break-words font-medium">{result.filename}</p>
              <div className="flex flex-col gap-4">
                <dl className="flex justify-between gap-4">
                  <div>
                    <dt className="text-muted-foreground">Similarity</dt>
                    <dd className="font-medium">
                      {result.similarity.toFixed(3)}
                    </dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-muted-foreground">Threshold</dt>
                    <dd className="font-medium">
                      {result.threshold.toFixed(3)}
                    </dd>
                  </div>
                </dl>
                <div
                  role="img"
                  aria-label={`Cosine similarity ${result.similarity.toFixed(3)} on a scale from minus one to one. Acceptance threshold ${result.threshold.toFixed(3)}.`}
                >
                  <div className="relative my-2 h-3 rounded-full bg-muted">
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-full',
                        result.similarity < result.threshold
                          ? 'bg-destructive'
                          : 'bg-primary/60',
                      )}
                      style={{ width: scorePosition(result.similarity) }}
                    />
                    <div
                      className="absolute -top-1 h-5 w-0.5 -translate-x-1/2 bg-foreground"
                      style={{ left: scorePosition(result.threshold) }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>−1</span>
                    <span>0</span>
                    <span>1</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.chunks.length} chunks processed
                  {result.empty_page_numbers.length > 0 &&
                    ` · ${result.empty_page_numbers.length} empty pages skipped`}
                </p>
              </div>
              <DialogFooter className="flex-row justify-end">
                <DialogClose render={<Button className="w-fit px-5" />}>
                  Done
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
