import { DocumentPreview } from '#/features/documents/document-preview'
import { DownloadIcon } from 'lucide-react'
import type { SearchResult } from './api'

type SearchResultCardProps = {
  result: SearchResult
  downloadUrl: string
}

export function SearchResultCard({
  result,
  downloadUrl,
}: SearchResultCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <DocumentPreview document={result} pageNumber={result.page_number} />
        <a
          href={downloadUrl}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          aria-label={`Download ${result.filename}`}
        >
          <DownloadIcon aria-hidden="true" className="size-4" />
          Download
        </a>
        <h2 className="min-w-0 flex-1 break-words font-medium">
          {result.filename}
        </h2>
        <p className="text-sm text-muted-foreground">
          {result.format.toUpperCase()} · Similarity:{' '}
          {result.similarity.toFixed(3)}
          {result.page_number !== null && ` · Page ${result.page_number}`}
        </p>
      </header>
      <div className="border-t bg-muted/40 px-4 py-3">
        <p className="whitespace-pre-wrap break-words text-sm leading-normal">
          {result.text}
        </p>
      </div>
    </article>
  )
}
