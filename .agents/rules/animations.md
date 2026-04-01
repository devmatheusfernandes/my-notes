# Official Rule: Page & Component Animations

This rule defines the standard, high-fidelity animation patterns for all pages and components using **Framer Motion** and standardized variants from `@/lib/animations`.

## 🏗 Anatomy
All pages in the Hub must follow this structural animation hierarchy:

1. **Root Container**: Use `motion.main` or `motion.div` with the `pageContainerVariants`.
2. **Child Elements**: Use `motion.section`, `motion.div`, or `motion.header` with the `itemFadeInUpVariants` to enable sequencing (staggering).

## 💻 Standard Implementation (JSX)

```tsx
import { motion } from "framer-motion";
import { pageContainerVariants, itemFadeInUpVariants } from "@/lib/animations";

export default function MyPage() {
  return (
    <motion.main
      className="page-container" // Standard CSS class for padding and layout
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemFadeInUpVariants}>
         <h1 className="page-title">Page Title</h1>
         <p className="page-description">Brief description of the page context.</p>
      </motion.div>
      
      <motion.section variants={itemFadeInUpVariants} className="card-section">
         {/* Main content here */}
      </motion.section>
    </motion.main>
  );
}
```

## 🎯 Constraints
- **Class Requirement**: Always apply the `.page-container` class to the main `motion.main` element for consistent alignment.
- **Variant Sources**: Exclusively use variants imported from `@/lib/animations`. Avoid defining ad-hoc animation objects in components.
- **Stagger Children**: The `pageContainerVariants` is pre-configured with a 0.1s stagger interval. Ensure children elements specifically use `itemFadeInUpVariants` to benefit from this effect.
- **Loading States**: If a page has a "data loading" phase, apply animations only once the final content is ready for display.
- **Performance**: Animations should have a `stiffness: 300, damping: 24` for a professional, non-robotic feel.
