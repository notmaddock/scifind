import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadDocument } from './api'

export function useUpload() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: async (result) => {
      if (result.accepted) {
        await Promise.all([
          client.invalidateQueries({ queryKey: ['documents'] }),
          client.invalidateQueries({ queryKey: ['search'] }),
        ])
      }
    },
  })
}
