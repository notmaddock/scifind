import { SearchForm } from './search-form'
import { SearchResultCard } from './search-result'
import type { SearchResponse } from './api'

type SearchPageProps = {
  search: string
  query: string
  data: SearchResponse | undefined
  isLoading: boolean
  isFetching: boolean
  isSuccess: boolean
  error: string | undefined
  getDownloadUrl: (id: string) => string
  onQueryChange: (query: string) => void
  onSubmit: () => void
  onRetry: () => void
}

export function SearchPage({
  search,
  query,
  data,
  isLoading,
  isFetching,
  isSuccess,
  error,
  getDownloadUrl,
  onQueryChange,
  onSubmit,
  onRetry,
}: SearchPageProps) {
  return (
    <main
      className={
        search
          ? 'flex h-full min-h-0 flex-col gap-4 overflow-hidden px-6 py-8'
          : 'flex h-full flex-col items-center justify-center gap-4 px-6'
      }
    >
      <h1 className="shrink-0 text-accent-foreground text-2xl font-medium">
        {search ? 'Search results' : 'scifind'}
      </h1>
      <SearchForm value={query} onChange={onQueryChange} onSubmit={onSubmit} />
      {search && (
        <>
          <div className="flex w-full shrink-0 flex-wrap items-baseline justify-between gap-2 text-sm text-muted-foreground">
            <p>Results for “{search}”</p>
            {data && (
              <p title="Time for the API request and response, including network travel">
                {data.items.length} results · {data.durationMs} ms
                {isFetching && ' · Updating…'}
              </p>
            )}
          </div>
          <section
            className="min-h-0 w-full flex-1 space-y-3 overflow-y-auto pr-2 scroll-fade"
            aria-live="polite"
            aria-busy={isFetching}
          >
            {isLoading && <p>Searching…</p>}
            {error && (
              <div role="alert">
                <p>{error}</p>
                <button type="button" className="underline" onClick={onRetry}>
                  Try again
                </button>
              </div>
            )}
            {isSuccess && data?.items.length === 0 && <p>No documents found.</p>}
            {data?.items.map((result) => (
              <SearchResultCard
                key={result.id}
                result={result}
                downloadUrl={getDownloadUrl(result.id)}
              />
            ))}
          </section>
        </>
      )}
    </main>
  )
}
