import { useMutation } from '@tanstack/react-query'
import { clusterEmbeddings } from './api'
import type { ClusteringSettings } from './api'

export function useClustering() {
  return useMutation({
    mutationFn: (settings: ClusteringSettings) => clusterEmbeddings(settings),
    gcTime: 0,
    retry: false,
  })
}
