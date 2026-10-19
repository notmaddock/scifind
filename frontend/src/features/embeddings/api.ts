import { apiUrl } from '#/lib/api'

export type ProjectionMethod = 'umap' | 'tsne'
export type EmbeddedDocument = {
  id: string
  filename: string
  position: [number, number]
}

export async function getEmbeddings(
  method: ProjectionMethod,
  signal?: AbortSignal,
) {
  const response = await fetch(`${apiUrl}/api/embeddings?method=${method}`, {
    signal,
    cache: 'no-store',
  })
  if (!response.ok)
    throw new Error('Could not project embeddings. Please try again.')
  return (await response.json()) as EmbeddedDocument[]
}

export type ClusteringSettings = {
  n_clusters: number
  init: 'k-means++' | 'random'
  n_init: number
  max_iter: number
  random_state: number
}

export type ClusteringResult = {
  labels: Record<string, number>
  inertia: number
  iterations: number
}

export async function clusterEmbeddings(
  settings: ClusteringSettings,
  signal?: AbortSignal,
) {
  const response = await fetch(`${apiUrl}/api/embeddings/cluster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
    signal,
    cache: 'no-store',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      typeof error.detail === 'string'
        ? error.detail
        : 'Could not cluster embeddings. Check your settings and try again.',
    )
  }
  return (await response.json()) as ClusteringResult
}
