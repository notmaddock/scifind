import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { documentUrl } from '#/features/documents/api'
import { SearchPage } from '#/features/search/search-page'
import { useSearch } from '#/features/search/use-search'

export const Route = createFileRoute('/_sidebar/search/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : '',
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { q } = Route.useSearch()
  return <SearchContainer key={q} q={q} />
}

function SearchContainer({ q }: { q: string }) {
  const navigate = useNavigate({ from: Route.fullPath })
  const [query, setQuery] = useState(q)
  const search = q.trim()
  const results = useSearch(search)

  return (
    <SearchPage
      search={search}
      query={query}
      data={results.data}
      isLoading={results.isLoading}
      isFetching={results.isFetching}
      isSuccess={results.isSuccess}
      error={results.error?.message}
      getDownloadUrl={documentUrl}
      onQueryChange={setQuery}
      onSubmit={() =>
        void navigate({ to: '/search', search: { q: query.trim() } })
      }
      onRetry={() => void results.refetch()}
    />
  )
}
