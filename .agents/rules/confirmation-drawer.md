# Official Rule: Action Confirmation Drawer

This rule defines the standard, high-fidelity UI pattern for all action confirmation drawers (e.g., delete, archive, logout) within the project.

## 🏗 Anatomy
All confirmation drawers must follow this structural hierarchy:

1. **Centralized Branding**: A top-level container with `flex flex-col items-center`.
2. **Icon Indicator**:
   - `w-12 h-12 rounded-full flex items-center justify-center mb-4`
   - Use themed backgrounds: `bg-red-100 dark:bg-red-900/30` for destructive, `bg-blue-100 dark:bg-blue-900/30` for info.
3. **Typography**:
   - **Title**: `DrawerTitle` with `text-xl font-bold`.
   - **Description**: `DrawerDescription` with `text-base pt-2 text-center`.
4. **Action Column**:
   - Container: `flex flex-col gap-3 py-6 w-full`.
   - **Confirm Button**: `h-12 text-base font-semibold rounded-xl` (variant matching the action context).
   - **Cancel Button**: `h-12 text-base rounded-xl` (variant `ghost`).

## 💻 Standard Implementation (JSX)

```tsx
<Drawer open={isOpen} onOpenChange={setIsOpen}>
  <DrawerContent>
    <div className="mx-auto w-full max-w-lg p-6">
      <DrawerHeader className="px-0 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <DrawerTitle className="text-xl">Confirm Action?</DrawerTitle>
        <DrawerDescription className="text-base pt-2">
          This is the standard description for important confirmations.
        </DrawerDescription>
      </DrawerHeader>
      
      <div className="flex flex-col gap-3 py-6">
        <Button 
          variant="destructive" 
          className="w-full h-12 text-base font-semibold rounded-xl"
          onClick={handleConfirm}
        >
          Confirm Action
        </Button>
        <Button 
          variant="ghost" 
          className="w-full h-12 text-base rounded-xl transition-all"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  </DrawerContent>
</Drawer>
```

## 🎯 Exceptions
- **Import Drawers**: These may contain forms or larger content areas and do not follow the centered confirmation pattern.
- **Navigation Menus**: These follow their own layout rules.
