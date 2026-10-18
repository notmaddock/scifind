import { useMutation } from '@tanstack/react-query'
import { uploadDocument } from './api'

export function useUpload() {
  return useMutation({ mutationFn: uploadDocument })
}
