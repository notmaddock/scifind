import { useQuery } from '@tanstack/react-query'
import { getEmbeddings } from './api'
import type { ProjectionMethod } from './api'

export function useEmbeddings(method: ProjectionMethod) {
  return useQuery({
    queryKey: ['embeddings', method],
    queryFn: ({ signal }) => getEmbeddings(method, signal),
    staleTime: 'static',
  })
}
