import { useRef, useState } from 'react'
import { CheckIcon, LoaderCircleIcon, XIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '#/components/ui/dialog'
import { cn } from '#/lib/utils'
import { useUpload } from './use-upload'
import type { UploadResult } from './api'

type UploadEntry = {
  file: File
  status: 'queued' | 'uploading' | 'done' | 'error' | 'cancelled'
  result?: UploadResult
  error?: string
}

export function BulkUpload({ disabled }: { disabled: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [entries, setEntries] = useState<UploadEntry[]>([])
  const [running, setRunning] = useState(false)
  const mutation = useUpload()
  const [open, setOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const cancelled = useRef(false)

  function isCancelled() {
    return cancelled.current
  }

  function cancel() {
    cancelled.current = true
    setCancelling(true)
    setEntries((current) =>
      current.map((entry) =>
        entry.status === 'queued' ? { ...entry, status: 'cancelled' } : entry,
      ),
    )
  }

  async function uploadFolder(files: File[]) {
    if (running) return
    const selected: UploadEntry[] = files
      .filter((file) => /\.(pdf|txt)$/i.test(file.name) && file.size > 0)
      .sort((a, b) => a.webkitRelativePath.localeCompare(b.webkitRelativePath))
      .map((file) => ({ file, status: 'queued' }))
    cancelled.current = false
    setCancelling(false)
    setOpen(true)
    setEntries(selected)
    setRunning(true)
    function update(index: number, entry: UploadEntry) {
      setEntries((current) =>
        current.map((item, i) => (i === index ? entry : item)),
      )
    }
    try {
      for (const [index, entry] of selected.entries()) {
        if (isCancelled()) break
        update(index, { ...entry, status: 'uploading' })
        try {
          const result = await mutation.mutateAsync(entry.file)
          update(index, { ...entry, status: 'done', result })
        } catch (error) {
          update(index, {
            ...entry,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          })
        }
      }
    } finally {
      setRunning(false)
    }
  }

  const completed = entries.filter(
    (entry) =>
      entry.status !== 'queued' &&
      entry.status !== 'uploading' &&
      entry.status !== 'cancelled',
  ).length

  return (
    <section className="flex min-w-0 flex-col gap-2" aria-label="Folder upload">
      <input
        ref={input}
        type="file"
        {...{ webkitdirectory: '' }}
        multiple
        className="hidden"
        aria-label="Choose a folder"
        disabled={disabled || running}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          if (files.length) void uploadFolder(files)
        }}
      />
      <Button
        variant="link"
        size="sm"
        disabled={disabled || running}
        onClick={() => input.current?.click()}
      >
        Upload an entire folder
      </Button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && running) return
          setOpen(nextOpen)
        }}
      >
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl"
          showCloseButton={!running}
        >
          <DialogHeader className="pr-8">
            <DialogTitle>Folder upload</DialogTitle>
            <DialogDescription>
              {running
                ? cancelling
                  ? 'Cancelling after the current document finishes…'
                  : 'Uploading PDF and TXT documents, including subfolders. Cancelling stops the queue after the current document finishes.'
                : cancelling
                  ? 'Upload cancelled. Completed documents are kept.'
                  : entries.length === 0
                    ? 'No non-empty PDF or TXT documents found in this folder.'
                    : 'Folder processing complete.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div
              className="flex justify-between text-xs text-muted-foreground"
              role="status"
            >
              <span>
                {completed}/{entries.length} files processed
              </span>
              <span>
                {entries.filter((entry) => entry.result?.accepted).length} added
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Folder progress"
              aria-valuemin={0}
              aria-valuemax={entries.length}
              aria-valuenow={completed}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary/60 transition-all"
                style={{
                  width: `${entries.length ? (completed / entries.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card text-xs">
            <div className="max-h-[45dvh] overflow-y-auto">
              <table className="w-full table-fixed text-left">
                <thead className="sticky top-0 bg-card text-muted-foreground">
                  <tr>
                    <th className="px-3 py-1.5 font-normal">Document</th>
                    <th className="w-32 py-1.5 text-right font-normal sm:w-44">
                      Similarity
                    </th>
                    <th className="w-28 px-3 py-1.5 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((entry, index) => {
                    const label = entry.result
                      ? entry.result.accepted
                        ? 'Added'
                        : 'Rejected'
                      : entry.status === 'error'
                        ? 'Failed'
                        : entry.status === 'cancelled'
                          ? 'Cancelled'
                          : entry.status === 'uploading'
                            ? 'Uploading'
                            : 'Queued'
                    return (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <p className="truncate" title={entry.file.name}>
                            {entry.file.name}
                          </p>
                          {entry.error && (
                            <p className="mt-0.5 break-words text-destructive">
                              {entry.error}
                            </p>
                          )}
                        </td>
                        <td className="text-right tabular-nums">
                          {entry.result ? (
                            <div className="flex items-center gap-2 py-1.5">
                              <span className="w-10 shrink-0">
                                {entry.result.similarity.toFixed(3)}
                              </span>
                              <div
                                role="img"
                                aria-label={`Similarity ${entry.result.similarity.toFixed(3)}, threshold ${entry.result.threshold.toFixed(3)}, scale minus one to one`}
                                title={`Threshold: ${entry.result.threshold.toFixed(3)} · Scale: −1 to 1`}
                                className="relative h-2 flex-1 rounded-full bg-muted"
                              >
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    entry.result.accepted
                                      ? 'bg-primary/60'
                                      : 'bg-destructive',
                                  )}
                                  style={{
                                    width: `${(Math.max(-1, Math.min(1, entry.result.similarity)) + 1) * 50}%`,
                                  }}
                                />
                                <span
                                  className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 bg-foreground"
                                  style={{
                                    left: `${(Math.max(-1, Math.min(1, entry.result.threshold)) + 1) * 50}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-1.5">
                            {entry.status === 'uploading' ? (
                              <LoaderCircleIcon
                                className="size-3 animate-spin"
                                aria-hidden="true"
                              />
                            ) : entry.result?.accepted ? (
                              <CheckIcon
                                className="size-3 text-primary"
                                aria-hidden="true"
                              />
                            ) : (
                              entry.status !== 'queued' && (
                                <XIcon
                                  className="size-3 text-destructive"
                                  aria-hidden="true"
                                />
                              )
                            )}
                            {label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Similarity: −1 to 1 · Marker shows the acceptance threshold.
          </p>
          <DialogFooter className="flex-row justify-end">
            {running ? (
              <Button
                variant="ghost"
                className="w-fit px-3"
                disabled={cancelling}
                onClick={cancel}
              >
                {cancelling ? 'Cancelling…' : 'Cancel remaining uploads'}
              </Button>
            ) : (
              <Button className="w-fit px-5" onClick={() => setOpen(false)}>
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
