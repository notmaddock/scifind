import { useQuery } from '@tanstack/react-query'
import { searchDocuments } from './api'

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    enabled: query.length > 0,
    queryFn: ({ signal }) => searchDocuments(query, signal),
  })
}
