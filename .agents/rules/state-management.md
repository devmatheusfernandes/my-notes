# Official Rule: State Management (SWR vs. Zustand)

This rule defines the strict boundaries between **Server State** (managed by SWR) and **UI State** (managed by Zustand).

## 🏗 Anatomy

| State Type | Management Tool | Description |
|---|---|---|
| **Server State** | `useSWR` + `Service` | Any document from Firestore or API (Notes, Folders, User). |
| **Global UI State** | `Zustand` | Ephemeral session data (selection mode, unlocked notes). |
| **Local UI State** | `useState` | Component-specific transient data (input values, hover states). |

## 💻 Standard Implementation (Zustand UI State)

```typescript
// store/useNoteStore.ts
export const useNoteStore = create<State>((set) => ({
  unlockedNotes: [],
  lockNote: (id) => set((s) => ({ unlockedNotes: s.unlockedNotes.filter(n => n !== id) })),
}));
```

## 🎯 Constraints

- **No Server State in Zustand**: ❌ NEVER fetch API data and store it in Zustand. This creates multiple "sources of truth." Use `useSWR` directly for these entities.
- **Optimistic Updates**: Always use `mutate(cacheKey, asyncFn, { optimisticData: ... })` for mutations (Create/Update/Delete).
- **Cache Key Consistency**: Use deterministic keys for `useSWR` (e.g., `['/notes', userId]`). Always wrap complex objects/arrays used as keys in `useMemo`.
- **Ephemeral Session**: Zustand data MUST be considered volatile. It should reset on page refresh (F5).
- **Form States**: Use `useState` or `react-hook-form` for individual input/validation lifecycles. Only use `Service` or `mutate` at the final submission point.
- **Server Components**: Prefer async Server Components for initial page data if interactivity/caching is not required. Only lift to SWR if client-side revalidation is needed.
