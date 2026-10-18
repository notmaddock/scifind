import { useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useEmbeddings } from './use-embeddings'
import type { ProjectionMethod } from './api'
import { EmbeddingsPlot } from './embeddings-plot'

export function EmbeddingsPage() {
  const [method, setMethod] = useState<ProjectionMethod>('umap')
  const embeddings = useEmbeddings(method)
  const points = embeddings.data ?? []

  return (
    <main className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium text-accent-foreground">
          Embeddings
        </h1>
        <Select
          items={{ umap: 'UMAP', tsne: 't-SNE' }}
          value={method}
          onValueChange={(value) => {
            if (value === 'umap' || value === 'tsne') setMethod(value)
          }}
        >
          <SelectTrigger aria-label="Projection method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="umap">UMAP</SelectItem>
            <SelectItem value="tsne">t-SNE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">
        Each point is a document's mean chunk embedding. Hover for its filename;
        click to preview, drag to pan and scroll to zoom.
      </p>
      {embeddings.isPending && <p role="status">Projecting documents…</p>}
      {embeddings.error && (
        <div role="alert">
          <p>{embeddings.error.message}</p>
          <Button variant="outline" onClick={() => embeddings.refetch()}>
            Try again
          </Button>
        </div>
      )}
      {embeddings.isSuccess &&
        (points.length === 0 ? (
          <p className="text-muted-foreground">
            Upload documents to visualize their embeddings.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {points.length} documents
              {points.length < 3
                ? ' · Upload at least 3 documents for a projection.'
                : ''}
            </p>
            <EmbeddingsPlot key={method} points={points} />
          </>
        ))}
    </main>
  )
}
