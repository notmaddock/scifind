import { createFileRoute } from '@tanstack/react-router'
import { EmbeddingsPage } from '#/features/embeddings/embeddings-page'

export const Route = createFileRoute('/_sidebar/embeddings/')({
  component: EmbeddingsPage,
})
