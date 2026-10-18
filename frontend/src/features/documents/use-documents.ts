import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteDocument, listDocuments } from './api'

export function useDocuments(query: string) {
  return useQuery({
    queryKey: ['documents', query],
    queryFn: ({ signal }) => listDocuments(query, signal),
  })
}

export function useDeleteDocument() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['documents'] }),
        client.invalidateQueries({ queryKey: ['search'] }),
        client.invalidateQueries({ queryKey: ['embeddings'] }),
      ])
    },
  })
}
