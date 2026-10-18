import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { SearchIcon } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group'

export const Route = createFileRoute('/_sidebar/search/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : '',
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { q } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [query, setQuery] = useState(q)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void navigate({ to: '/search', search: { q: query } })
  }

  if (q) {
    return (
      <main className="flex h-full flex-col gap-4 px-6 py-8">
        <h1 className="text-accent-foreground text-2xl font-medium">Search results</h1>
        <p>{q}</p>
      </main>
    )
  }

  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-accent-foreground text-2xl font-medium">scifind</h1>
      <form className="w-full max-w-md" onSubmit={handleSubmit}>
        <InputGroup className="h-12 rounded-full p-1.5">
          <InputGroupInput
            type="search"
            className="[&::-webkit-search-cancel-button]:hidden"
            placeholder="What are you looking for?"
            aria-label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <InputGroupAddon
            align="inline-end"
            className="h-full py-0 pr-0 has-[>button]:mr-0"
          >
            <InputGroupButton
              type="submit"
              aria-label="Search"
              size="icon-sm"
              className="size-9 rounded-full bg-accent p-0 text-accent-foreground hover:bg-accent/80"
            >
              <SearchIcon aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </main>
  )
}
