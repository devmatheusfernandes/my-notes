# Official Rule: Search Inputs & Empty States

This rule defines the standard patterns for search inputs and the mandatory "Empty States" that must be displayed when a search returns no results.

## 🏗 Anatomy
All searchable list UI patterns must follow this structural logic:

1. **Active Filter Check**: Identify if a search query is present.
2. **Result Count Verification**: Count results for the current query.
3. **Empty State Trigger**: Render the `Empty` component if `query exists && count === 0`.

## 💻 Standard Implementation (JSX)

```tsx
import { SearchX } from "lucide-react";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

// Inside component rendering
{searchQuery && results.length === 0 ? (
  <Empty className="mt-8">
    <EmptyContent>
      <EmptyMedia variant="icon">
        <SearchX />
      </EmptyMedia>
      <EmptyTitle>No results found</EmptyTitle>
      <EmptyDescription>
        Your search for "{searchQuery}" did not match any items.
      </EmptyDescription>
    </EmptyContent>
  </Empty>
) : (
  <ResultList items={results} />
)}
```

## 🎯 Constraints
- **Component Source**: Always use the UI library's `Empty` component family (`@/components/ui/empty`).
- **Icon Requirement**: The `EmptyMedia` should use `variant="icon"` and include a relevant `lucide-react` icon (e.g., `SearchX`).
- **Contextual Feedback**: The `EmptyDescription` MUST explicitly mention the search term (if applicable) to confirm the user's intent.
- **Consistency**: Never use custom "No items found" text strings without the standardized `Empty` component hierarchy.
