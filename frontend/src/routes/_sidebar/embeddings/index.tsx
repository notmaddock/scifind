import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_sidebar/embeddings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_sidebar/embeddings/"!</div>
}
