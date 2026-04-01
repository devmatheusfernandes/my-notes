# Official Rule: UI/UX & Design System

This rule defines the core visual, interactive, and structural patterns for ensuring a premium, mobile-first user experience.

## 🏗 Anatomy
All interface elements must follow these stylistic and functional hierarchies:

1. **Mobile-First Containers**: Use `.page-container` for the root structure.
2. **Interactive Elements**: Use `.card-section` for groupings with standardized borders, backgrounds, and hover effects.
3. **Typography Scaling**: Use `.page-title` for headers and `.page-description` for supporting text.

## 💻 Standard Implementation (Mobile-First Card)

```tsx
<motion.section 
  variants={itemFadeInUpVariants} 
  className="card-section" // Standardized card styling
>
  <h2 className="card-title">Feature Title</h2>
  <p className="card-description">Detailed description of the feature.</p>
  
  <div className="flex flex-col sm:flex-row gap-4 mt-6">
    <Button className="w-full sm:w-auto">Primary Action</Button>
  </div>
</motion.section>
```

## 🎯 Constraints
- **Drawer Preferred**: ❌ NEVER use native `window.confirm()` or basic `Dialog` for destructive/confirmation actions. ALWAYS use the standardized **Drawer** pattern.
  - *Refer to [confirmation-drawer.md](./confirmation-drawer.md) for anatomy and implementation.*
- **Responsive Layouts**: Design for touch first. Use `.flex-col` for inputs on small screens, transitioning to `.sm:flex-row` on desktop.
- **Visual Feedback**:
  - Use `toast.promise` for long-running operations.
  - Use status indicators (e.g., `bg-emerald-500` for active) instead of just text labels.
  - Provide immediate feedback text below disabled elements explaining **why** they are locked.
- **Padding Integrity**: Standardize spacing with Tailwind's utility scale (e.g., `gap-4`, `space-y-8`). Never hardcode pixel values in styles.
- **Surface Styling**: Use the `.card-section` class exclusively for content groupings to ensure consistent rounded corners (`rounded-2xl`), shadows, and borders.
