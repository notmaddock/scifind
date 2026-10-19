import { useId, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/components/ui/dialog'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/components/ui/tooltip'
import { Input } from '#/components/ui/input'
import { useClustering } from './use-clustering'
import type { ClusteringSettings, ProjectionMethod } from './api'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useEmbeddings } from './use-embeddings'
import { clusterColor, EmbeddingsPlot } from './embeddings-plot'

const parameterHelp = {
  n_clusters:
    'Number of groups to find. Cannot exceed the number of documents.',
  n_init:
    'Number of runs with different starting centers. Keeps the result with the lowest inertia.',
  max_iter:
    'Maximum number of center-update steps per run. The algorithm may converge sooner.',
  random_state:
    'Controls randomness. The same seed and settings reproduce the same groups; change it to explore another result.',
}

export function EmbeddingsPage({
  documentId,
  onClearFocus,
}: {
  documentId?: string
  onClearFocus: () => void
}) {
  const formId = useId()
  const [method, setMethod] = useState<ProjectionMethod>('umap')
  const embeddings = useEmbeddings(method)
  const points = embeddings.data ?? []
  const [settings, setSettings] = useState<ClusteringSettings>({
    n_clusters: 3,
    init: 'k-means++',
    n_init: 10,
    max_iter: 300,
    random_state: 42,
  })
  const [clusteringOpen, setClusteringOpen] = useState(false)
  const clustering = useClustering()
  const labels = clustering.data?.labels

  return (
    <main className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium text-accent-foreground">
          Embeddings
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={embeddings.isFetching}
            onClick={() => void embeddings.refetch()}
          >
            {embeddings.isFetching ? 'Projecting…' : 'Regenerate projection'}
          </Button>
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
      </div>
      <p className="text-sm text-muted-foreground">
        Each point is a document's mean chunk embedding. Hover for its filename;
        click to preview, drag to pan and scroll to zoom.
      </p>
      <TooltipProvider>
        <Dialog open={clusteringOpen} onOpenChange={setClusteringOpen}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
            <DialogHeader className="w-full pr-6">
              <DialogTitle>K-means clustering</DialogTitle>
              <DialogDescription>
                Groups original embeddings before projection. Colors identify
                clusters; nearby projected points may belong to different
                groups.
              </DialogDescription>
            </DialogHeader>
            <form
              id={formId}
              className="flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                clustering.mutate(
                  { ...settings },
                  { onSuccess: () => setClusteringOpen(false) },
                )
              }}
            >
              {(
                [
                  [
                    'n_clusters',
                    'Clusters (k)',
                    1,
                    Math.min(100, points.length),
                  ],
                  ['n_init', 'Restarts', 1, 100],
                  ['max_iter', 'Max iterations', 1, 1000],
                  ['random_state', 'Random seed', 0, 4294967295],
                ] as const
              ).map(([key, label, min, max]) => (
                <label key={key} className="flex flex-col gap-1 text-sm">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          className="w-fit cursor-help underline decoration-dotted underline-offset-4"
                        />
                      }
                    >
                      {label}
                    </TooltipTrigger>
                    <TooltipContent>{parameterHelp[key]}</TooltipContent>
                  </Tooltip>
                  <Input
                    className="w-32"
                    type="number"
                    required
                    min={min}
                    max={Math.max(min, max)}
                    step={1}
                    value={Number.isNaN(settings[key]) ? '' : settings[key]}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        [key]: event.target.valueAsNumber,
                      })
                    }
                  />
                </label>
              ))}
              <label className="flex flex-col gap-1 text-sm">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className="w-fit cursor-help underline decoration-dotted underline-offset-4"
                      />
                    }
                  >
                    Initialization
                  </TooltipTrigger>
                  <TooltipContent>
                    How starting centers are chosen. k-means++ spreads them out;
                    Random selects random documents.
                  </TooltipContent>
                </Tooltip>
                <Select
                  items={{ 'k-means++': 'k-means++', random: 'Random' }}
                  value={settings.init}
                  onValueChange={(value) => {
                    if (value === 'k-means++' || value === 'random')
                      setSettings({ ...settings, init: value })
                  }}
                >
                  <SelectTrigger aria-label="Initialization">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="k-means++">k-means++</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              {clustering.isPending && (
                <p role="status">Clustering documents…</p>
              )}
              {clustering.error && (
                <p role="alert">{clustering.error.message}</p>
              )}
            </form>
            <DialogFooter>
              {labels && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => clustering.reset()}
                >
                  Clear clustering
                </Button>
              )}
              <Button
                type="submit"
                form={formId}
                disabled={!points.length || clustering.isPending}
              >
                {clustering.isPending ? 'Clustering…' : 'Run K-means'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
      {labels && (
        <div
          className="flex w-full flex-wrap gap-3 text-sm"
          aria-label="Cluster legend"
        >
          {Array.from(new Set(Object.values(labels)))
            .sort((a, b) => a - b)
            .map((cluster) => (
              <span key={cluster} className="flex items-center gap-1">
                <span
                  className="size-3 rounded-full"
                  style={{
                    backgroundColor: `rgb(${clusterColor(cluster).slice(0, 3).join(' ')})`,
                  }}
                />
                Cluster {cluster + 1} ·{' '}
                {points.filter((point) => labels[point.id] === cluster).length}{' '}
                documents
              </span>
            ))}
          <span>
            Inertia: {clustering.data!.inertia.toFixed(2)} ·{' '}
            {clustering.data!.iterations} iterations
          </span>
          {new Set(Object.values(labels)).size <
            clustering.variables!.n_clusters && (
            <p role="status">
              Fewer distinct groups were found than requested; some embeddings
              are identical.
            </p>
          )}
        </div>
      )}

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
            {documentId && !points.some((point) => point.id === documentId) && (
              <p role="status" className="text-sm text-muted-foreground">
                This document is not available in the embeddings visualization.
              </p>
            )}
            <EmbeddingsPlot
              key={method}
              points={points}
              labels={labels}
              documentId={documentId}
              onClearFocus={onClearFocus}
              onConfigureClustering={() => setClusteringOpen(true)}
            />
          </>
        ))}
    </main>
  )
}
