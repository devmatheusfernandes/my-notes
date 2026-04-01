# Official Rule: TypeScript Standards

This rule defines the mandatory type safety requirements to ensure code robustness, maintainability, and IDE predictability.

## 🏗 Anatomy
All code must prioritize strong, explicit typing:

1. **Explicit Return Types**: All functions and exports should explicitly define their return types.
2. **Prop Interfaces**: Component props must be defined via Types or Interfaces.
3. **Type Guards**: Use runtime type checks (Type Guards) when handling `unknown` data from external sources.

## 💻 Standard Implementation (Prop Extension)

```typescript
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "custom" | "default";
  isLoading?: boolean;
};

export const CustomButton = ({ variant = "default", isLoading, ...props }: ButtonProps) => {
  return <button {...props} disabled={isLoading} />;
};
```

## 🎯 Constraints
- **Strict `any` Prohibition**: ❌ Manual/explicit use of `any` is strictly FORBIDDEN. It defeats the purpose of the project's type system.
- **`unknown` over `any`**: If types are truly uncertain (e.g., legacy API or complex DOM events), use `unknown` combined with a Type Guard or Type Assertion.
- **Library Extension**: When extending native elements, always use `React.ComponentProps<T>` or `React.HTMLAttributes<T>` to maintain inheritance integrity.
- **Type Safety > Quick Fix**: Never sacrifice type correctness for a faster implementation.
- **Zod Sync**: Ensure Zod schemas used for validation match the derived TypeScript types where applicable.
