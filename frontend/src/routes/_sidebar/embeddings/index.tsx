import { createFileRoute } from '@tanstack/react-router'
import { EmbeddingsPage } from '#/features/embeddings/embeddings-page'

export const Route = createFileRoute('/_sidebar/embeddings/')({
  validateSearch: (search: Record<string, unknown>) => ({
    document: typeof search.document === 'string' ? search.document : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { document } = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <EmbeddingsPage
      documentId={document}
      onClearFocus={() => {
        void navigate({ search: { document: undefined }, replace: true })
      }}
    />
  )
}
