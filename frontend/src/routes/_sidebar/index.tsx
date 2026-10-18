import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_sidebar/')({
  beforeLoad: () => { throw redirect({ to: '/search' }) }
})