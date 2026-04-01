# Official Rule: Architecture Patterns

This rule defines the core architectural layers of the application, ensuring strict separation of concerns between business logic, persistence, and the visual layer.

## 🏗 Anatomy

| Layer | Responsibility | Allowed Tools/Methods |
|---|---|---|
| **Services** (`/services/...`) | Direct interaction with DB/APIs. | Firebase Admin SDK, `fetch`. |
| **Store** (`/store/...`) | **UI-Side State only** (Ephemeral). | Zustand. |
| **Hooks** (`/hooks/...`) | Orchestration (SWR + Service + Store). | `useSWR`, `mutate`, custom hooks. |
| **Components** (`/components/...`) | Visual View layer. | React, Framer Motion, hooks. |
| **API Routes** (`/app/api/...`) | Backend endpoints for secrets/admin logic. | Next.js API handlers. |
| **Server Actions** (`/actions/...`) | Server-side mutations and revalidations. | `'use server'`, `next/cache`. |

## 💻 Standard Implementation (Hooks with Optimistic UI)

```typescript
const { data, mutate } = useSWR(cacheKey, async () => {
  return await service.getData();
}, { 
  optimisticData: updatedData,
  rollbackOnError: true,
  revalidate: false 
});
```

## 🎯 Constraints

1. **No Direct Firebase in UI**: Never import Firebase SDK functions (`doc`, `getDoc`, etc.) in React components. Use **Services** instead.
2. **SWR is Source of Truth**: All server data must be managed by SWR. Never duplicate server data in a Zustand store.
3. **Zustand for UI Only**: Store only transient UI states like "items selected", "modals open", or "locks active in session".
4. **useEffect Lockdown**:
   - ❌ Never use `useEffect` for data fetching on component mount (use SWR).
   - ❌ Never use `useEffect` to react to user events (use direct handlers).
   - ✅ Always include a `cleanup` function for subscriptions or listeners.
5. **API Safety**: Validate all inputs with **Zod** in API Routes and Server Actions.

---
*For security guidelines, refer to [security.md](./security.md).*
