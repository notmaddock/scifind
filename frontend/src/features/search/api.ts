import { apiUrl } from '#/lib/api'

export type SearchResult = {
  id: string
  filename: string
  format: string
  text: string
  similarity: number
  page_number: number | null
}

export async function searchDocuments(query: string, signal: AbortSignal) {
  const url = new URL(`${apiUrl}/api/search`)
  url.searchParams.set('q', query)
  const startedAt = performance.now()
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Search failed (${response.status}). Please try again.`)
  }
  const items: SearchResult[] = await response.json()
  return { items, durationMs: Math.round(performance.now() - startedAt) }
}

export type SearchResponse = Awaited<ReturnType<typeof searchDocuments>>
