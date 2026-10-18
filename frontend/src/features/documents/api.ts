import { apiUrl } from '#/lib/api'

export type DocumentSummary = {
  id: string
  filename: string
  format: string
}

export function documentUrl(id: string, inline = false) {
  return `${apiUrl}/api/documents/${encodeURIComponent(id)}/download${inline ? '?inline=true' : ''}`
}

export async function listDocuments(
  query: string,
  signal: AbortSignal,
): Promise<DocumentSummary[]> {
  const url = new URL(`${apiUrl}/api/documents`)
  url.searchParams.set('q', query)
  const response = await fetch(url, { signal })
  if (!response.ok)
    throw new Error('Could not load documents. Please try again.')
  return response.json()
}

export async function deleteDocument(id: string) {
  const response = await fetch(
    `${apiUrl}/api/documents/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  )
  if (!response.ok)
    throw new Error('Could not delete the document. Please try again.')
}
