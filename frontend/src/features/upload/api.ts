import { apiUrl } from '#/lib/api'

export type UploadResult = {
  filename: string
  accepted: boolean
  similarity: number
  threshold: number
  chunks: unknown[]
  empty_page_numbers: number[]
}

export async function uploadDocument(file: File): Promise<UploadResult> {
  const body = new FormData()
  body.append('file', file)
  const response = await fetch(`${apiUrl}/api/documents`, {
    method: 'POST',
    body,
  })
  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new Error(
      typeof problem?.detail === 'string'
        ? problem.detail
        : `Upload failed (${response.status}). Please try again.`,
    )
  }
  return response.json()
}
