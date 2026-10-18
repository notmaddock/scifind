import { apiUrl } from '#/lib/api'

export type ProjectionMethod = 'umap' | 'tsne'
export type EmbeddedDocument = {
  id: string
  filename: string
  position: [number, number]
}

export async function getEmbeddings(
  method: ProjectionMethod,
  signal: AbortSignal,
) {
  const response = await fetch(`${apiUrl}/api/embeddings?method=${method}`, {
    signal,
  })
  if (!response.ok)
    throw new Error('Could not project embeddings. Please try again.')
  return (await response.json()) as EmbeddedDocument[]
}
