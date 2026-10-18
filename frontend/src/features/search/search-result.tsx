import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { DocumentPreview } from '#/features/documents/document-preview'
import { DownloadIcon, LocateFixedIcon } from 'lucide-react'
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
        <h2 className="min-w-0 flex-1 break-words font-medium">
          {result.filename}
        </h2>
        <p className="text-sm text-muted-foreground">
          {result.format.toUpperCase()} · Similarity:{' '}
          {result.similarity.toFixed(3)}
          {result.page_number !== null && ` · Page ${result.page_number}`}
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <DocumentPreview document={result} pageNumber={result.page_number} />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  nativeButton={false}
                  render={
                    <Link to="/embeddings" search={{ document: result.id }} />
                  }
                />
              }
              aria-label={`Locate ${result.filename} in embeddings`}
            >
              <LocateFixedIcon />
            </TooltipTrigger>
            <TooltipContent>Locate in embeddings</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  nativeButton={false}
                  render={<a href={downloadUrl} />}
                />
              }
              aria-label={`Download ${result.filename}`}
            >
              <DownloadIcon />
            </TooltipTrigger>
            <TooltipContent>Download document</TooltipContent>
          </Tooltip>
        </div>
      </header>
      <div className="border-t bg-muted/40 px-4 py-3">
        <p className="whitespace-pre-wrap break-words text-sm leading-normal">
          {result.text}
        </p>
      </div>
    </article>
  )
}
