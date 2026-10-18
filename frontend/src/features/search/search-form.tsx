import { SearchIcon } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group'

type SearchFormProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function SearchForm({ value, onChange, onSubmit }: SearchFormProps) {
  return (
    <form
      className="w-full max-w-md shrink-0"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <InputGroup className="h-12 rounded-full p-1.5">
        <InputGroupInput
          type="search"
          className="[&::-webkit-search-cancel-button]:hidden" // remove dumb X added by chrome for some reason
          placeholder="What are you looking for?"
          aria-label="Search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
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
  )
}
