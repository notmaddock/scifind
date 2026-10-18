import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_sidebar/upload/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_sidebar/upload/"!</div>
}
