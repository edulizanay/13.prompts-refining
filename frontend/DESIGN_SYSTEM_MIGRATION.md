# Design System Migration Audit

**Date**: 2025-10-26
**Purpose**: Document all components requiring updates to use the new design tokens from `tailwind.config.ts` and `design-context.yaml`

---

## File Responsibilities (Critical Context)

Before starting migration, understand what belongs where:

### `tailwind.config.ts` - Design Tokens (Single Source of Truth)
**What goes here:**
- ✅ Colors (neutral, purple, success, error, warning)
- ✅ Spacing scale (0, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20)
- ✅ Typography (font sizes, font families, line heights)
- ✅ Border radius (sm, md, lg, xl, full)
- ✅ Shadows (sm, md, lg, xl)
- ✅ Animation keyframes and utilities
- ✅ Transition durations and timing functions
- ✅ Breakpoints (responsive sizes)

**Why:** These are **reusable design tokens** that Tailwind generates utility classes from (e.g., `bg-purple-500`, `text-neutral-700`, `animate-fade-in`)

### `styles/globals.css` - Global Base Styles
**What goes here:**
- ✅ Tailwind imports (`@tailwind base/components/utilities`)
- ✅ CSS resets (`* { margin: 0; padding: 0; box-sizing: border-box; }`)
- ✅ Base HTML element defaults (`html`, `body`, `code`, `a`, `h1-h6`)
- ✅ Third-party CSS overrides (CodeMirror, library styles)
- ✅ Global styles that **cannot** be expressed as Tailwind utilities

**What does NOT go here:**
- ❌ Animations (use `tailwind.config.ts` instead)
- ❌ Hardcoded color values (use design tokens)
- ❌ Component-specific styles (use Tailwind classes in components)

**Why:** This file sets up **one-time global defaults** for raw HTML elements. It's imported once at app root (`layout.tsx`) and once in Storybook (`preview.ts`).

### Key Principle:
**If it's reusable → `tailwind.config.ts`**
**If it's a global default → `globals.css`**
**If it's component-specific → Tailwind classes in component**

---

## Executive Summary

After establishing our design system foundation (purple accent, neutral grays, standardized spacing, animations), we need to migrate existing components to use the new design tokens consistently. This audit identifies:

- **6 main components** using `gray-*` (should use `neutral-*`) - **including ResultsGrid.tsx**
- **1 component** with hardcoded hex colors (`PromptEditor.tsx`)
- **6 components** using legacy aliases (`primary`, `accent-light`, `accent-dark`):
  - ResultsGrid.tsx (uses `accent-light`, `text-primary`, `border-primary`)
  - page.tsx (uses `text-primary`, `border-primary`)
  - DatasetSelector.tsx (uses `text-primary`, `bg-primary`)
  - ModelManager.tsx (uses `hover:border-primary`, `hover:text-primary`, `bg-primary`, `ring-primary`)
  - EditorPanel.tsx (uses `bg-primary`, `ring-primary`, `hover:text-primary`)
  - layout.tsx (uses `bg-background`)
- **3 components** with custom button styling (should use `<Button>` component)

---

## Migration Priority

### 🔴 HIGH PRIORITY (Visual inconsistency)

#### 1. **PromptEditor.tsx** (lines 131-211)
**Issue**: Hardcoded hex colors in CodeMirror theme instead of design tokens

**Current state**:
```tsx
const customTheme = EditorView.theme({
  '&': {
    border: '1px solid #d1d5db',  // ❌ Hardcoded gray
    borderRadius: '0.375rem',     // ❌ Should use Tailwind token
  },
  '&.cm-focused': {
    boxShadow: '0 0 0 2px #8685ef',  // ❌ Hardcoded purple
  },
  '.cm-placeholder': {
    color: '#9ca3af',  // ❌ Hardcoded gray
  },
  '.cm-gutters': {
    backgroundColor: '#fafafa',          // ❌ Hardcoded
    borderRight: '1px solid #e5e7eb',    // ❌ Hardcoded
    color: '#c4b5fd',                     // ❌ Hardcoded purple/300
  },
  '.cm-scroller:hover::-webkit-scrollbar-thumb': {
    background: '#d1d5db',  // ❌ Hardcoded
  },
  '.cm-prompt-variable': {
    color: '#8685ef',      // ❌ Hardcoded purple-500
    background: '#faf8ff',  // ❌ Hardcoded purple-50
  },
}
```

**Required changes**:
- Replace `#8685ef` → `purple-500` (use CSS variable or keep hex since CodeMirror theme)
- Replace `#fafafa` → `neutral-50`
- Replace `#f5f5f5` → `neutral-100`
- Replace `#e5e7eb` → `neutral-200`
- Replace `#d1d5db` → `neutral-300`
- Replace `#9ca3af` → `neutral-400`
- Replace `#c4b5fd` → Should be `purple-300` but doesn't exist in palette - need clarification
- Replace `#faf8ff` → `purple-50`
- Replace `0.375rem` → `rounded` (6px)

**Notes**: CodeMirror themes use plain CSS, so we may need to keep hex values but ensure they match our token values exactly.

---

#### 2. **EditorPanel.tsx** (throughout)
**Issue**: Uses `gray-*` instead of `neutral-*`, custom button styling, legacy `text-primary`

**Line-by-line changes needed**:

| Line | Current | Should be |
|------|---------|-----------|
| 237 | `border border-gray-300` | `border border-neutral-300` |
| 250 | `text-gray-700 border border-gray-300` | `text-neutral-700 border border-neutral-300` |
| 256 | `text-sm font-medium` (custom button) | Use `<Button variant="primary">` |
| 213 | `text-gray-500` | `text-neutral-500` |
| 227 | `text-gray-900` | `text-neutral-900` |
| 237 | `focus:ring-primary` | ✅ Correct (purple-500 alias) |
| 270 | `text-red-600` | `text-error-600` |
| 299 | `border border-gray-300` | `border border-neutral-300` |
| 304 | `text-gray-900 hover:text-primary` | `text-neutral-900 hover:text-purple-500` |
| 307 | `text-gray-400` | `text-neutral-400` |
| 315 | `hover:bg-gray-100` | `hover:bg-neutral-100` |
| 319 | `text-gray-500` | `text-neutral-500` |
| 332 | `text-gray-500` | `text-neutral-500` |
| 396 | `text-gray-700` | `text-neutral-700` |
| 401 | `bg-purple-100 text-purple-700` | ✅ Correct |

**Custom buttons to replace with Button component**:
- Line 248-260: Cancel/Create buttons in new prompt modal
- Line 273-278: OK button in error modal

---

#### 3. **ModelManager.tsx** (throughout)
**Issue**: Uses `gray-*`, custom buttons, legacy focus styles

**Changes needed**:

| Line | Current | Should be |
|------|---------|-----------|
| 105 | `border border-gray-200 hover:border-primary` | `border border-neutral-200 hover:border-purple-500` |
| 110-111 | `text-gray-900`, `text-gray-500` | `text-neutral-900`, `text-neutral-500` |
| 118 | `text-gray-400 group-hover:text-gray-400` | `text-neutral-400 group-hover:text-neutral-400` |
| 130 | `text-gray-400 hover:text-primary` | `text-neutral-400 hover:text-purple-500` |
| 146 | `text-gray-900` | `text-neutral-900` |
| 151 | `text-gray-700` | `text-neutral-700` |
| 154 | `border border-gray-300 focus:ring-primary hover:bg-gray-50` | `border border-neutral-300 focus:ring-2 focus:ring-purple-500 hover:bg-neutral-50` |
| 178 | Same as 151, 154 | Same fixes |
| 199-202 | Custom button (Add) | Use `<Button variant="primary" className="w-full">` |
| 205 | `text-gray-500`, `bg-gray-100` | `text-neutral-500`, `bg-neutral-100` |
| 215 | `text-red-600` | `text-error-600` |
| 216 | `text-gray-700` | `text-neutral-700` |
| 219-223 | Custom OK button | Use `<Button variant="primary">` |

---

#### 4. **DatasetSelector.tsx**
**Issue**: Uses `gray-*`, custom button styling, legacy color patterns

**Changes needed**:

| Line | Current | Should be |
|------|---------|-----------|
| 35 | `text-primary hover:bg-primary hover:bg-opacity-10` | Use `<Button variant="secondary" size="small">` instead |
| 43 | `text-gray-500` | `text-neutral-500` |
| 57 | `border-gray-200` | `border-neutral-200` |
| 58 | `text-gray-900` | `text-neutral-900` |
| 61 | `text-gray-500 hover:text-gray-700` | `text-neutral-500 hover:text-neutral-700` |
| 70 | `bg-gray-50` | `bg-neutral-50` |
| 75 | `text-gray-700 border-gray-200` | `text-neutral-700 border-neutral-200` |
| 84 | `bg-gray-50` | `bg-neutral-50` |
| 86 | `border-gray-200 text-gray-600` | `border-neutral-200 text-neutral-600` |
| 96 | `border-gray-200 text-gray-500` | `border-neutral-200 text-neutral-500` |

---

#### 5. **ResultsGrid.tsx** ⚠️ MISSING FROM INITIAL AUDIT
**Issue**: Uses `gray-*`, legacy `accent-light` alias, legacy `text-primary`/`border-primary`

**Changes needed**:

| Line | Current | Should be |
|------|---------|-----------|
| 56 | `border border-gray-200` | `border border-neutral-200` |
| 61 | `bg-gray-50 border-gray-200` | `bg-neutral-50 border-neutral-200` |
| 63 | `text-gray-700` | `text-neutral-700` |
| 69 | `text-gray-700` | `text-neutral-700` |
| 80 | `border-gray-200 hover:bg-gray-50` | `border-neutral-200 hover:bg-neutral-50` |
| 82 | `text-gray-600 bg-gray-50` | `text-neutral-600 bg-neutral-50` |
| 112 | `text-gray-400` | `text-neutral-400` |
| 121 | `bg-accent-light border-gray-300` | `bg-purple-50 border-neutral-300` |
| 121 | `text-primary border-primary` (elsewhere) | `text-purple-500 border-purple-500` |
| 122 | `text-gray-900 bg-gray-100` | `text-neutral-900 bg-neutral-100` |

**Note**: This component is critical - it's the main results table. Must be migrated BEFORE removing aliases.

---

### 🟡 MEDIUM PRIORITY (Functional but inconsistent)

#### 6. **page.tsx** (Main application page)
**Issue**: Uses `gray-*` for toolbar/UI chrome, legacy `bg-background` alias, custom buttons

**Changes needed**:

| Line | Current | Should be |
|------|---------|-----------|
| 182 | `bg-background` | `bg-neutral-50` (or keep alias - it's intentional backward compat) |
| 216 | `bg-gray-50 border border-gray-200` | `bg-neutral-50 border border-neutral-200` |
| 219 | `bg-purple-50 text-primary border border-purple-200 hover:bg-purple-100 hover:border-primary` | Use design tokens consistently (already using purple correctly) |
| 231-237 | Custom grader button | Consider using `<Button variant="secondary">` with icon |
| 262-266 | Custom upload button | Use `<Button variant="secondary" size="small">` with icon-only pattern |
| 269 | Inline spinner | Already using `animate-spin` ✅ |
| 282-283 | `bg-green-100 border-green-200 text-green-700` | Use `success-50`, `success-600` tokens |
| 283 | `bg-red-100 border-red-200 text-red-700` | Use `error-50`, `error-600` tokens |

**Note**: Line 187 uses `duration-comfortable` and `ease-spring` - ✅ already using design tokens!

---

#### 7. **layout.tsx** (Root layout)
**Issue**: Uses legacy `bg-background` alias

**Changes needed**:

| Line | Current | Should be |
|------|---------|-----------|
| 21 | `className="bg-background"` | `className="bg-neutral-50"` |

**Code change**:
```tsx
// BEFORE
<body className="bg-background">{children}</body>

// AFTER
<body className="bg-neutral-50">{children}</body>
```

**Note**: This is a simple one-line fix but critical - sets the app background color.

---

### 🟢 LOW PRIORITY (Optional improvements)

#### 8. **ui/modal.tsx**
**Issue**: Uses `black/50` for backdrop instead of semantic color

**Changes needed**:

| Line | Current | Should be |
|------|---------|-----------|
| 62 | `bg-black/50` | Consider `bg-neutral-900/50` for consistency |

**Note**: This is a minor change and `black/50` is a common pattern. Consider if worth changing.

---

#### 9. **ui/dropdown-menu.tsx**
**Issue**: Likely uses `gray-*` (need to check if already updated)

**Action needed**: Read file to verify current state

---

### 🟢 LOW PRIORITY (Already correct or intentional exceptions)

#### ✅ **ui/button.tsx**
Already using design tokens correctly:
- `purple-500`, `purple-600`, `purple-700` for primary
- `purple-50`, `purple-100` for secondary
- `neutral-*` for outline/ghost
- `error-*` for destructive

#### ✅ **ui/badge.tsx**
Already using design tokens correctly

#### ✅ **ui/spinner.tsx**
Already using `animate-spin` animation token

#### ✅ **ui/kbd.tsx**
Minimal styling, no color tokens needed

---

## Pattern Improvements Needed

### 1. **Replace custom button markup with Button component**

**Current pattern** (found in multiple files):
```tsx
<button
  onClick={handleAction}
  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium"
>
  Action
</button>
```

**Should be**:
```tsx
<Button variant="primary" size="medium" onClick={handleAction}>
  Action
</Button>
```

**Locations**:
- EditorPanel.tsx (lines 248-260, 273-278)
- ModelManager.tsx (lines 199-202, 219-223)
- DatasetSelector.tsx (line 33-38)
- page.tsx (lines 231-237, 262-266)

### 2. **Replace gray-* with neutral-***

**Automated find/replace**:
- `gray-50` → `neutral-50`
- `gray-100` → `neutral-100`
- `gray-200` → `neutral-200`
- `gray-300` → `neutral-300`
- `gray-400` → `neutral-400`
- `gray-500` → `neutral-500`
- `gray-600` → `neutral-600`
- `gray-700` → `neutral-700`
- `gray-800` → `neutral-800`
- `gray-900` → `neutral-900`

**Note**: Our neutral palette includes ALL shades from 50-900 (see `tailwind.config.ts:14-23`). No special mapping needed.

### 3. **Use semantic color tokens for feedback**

| Current | New Token |
|---------|-----------|
| `text-green-700`, `bg-green-100`, `border-green-200` | `text-success-600`, `bg-success-50`, `border-success-500` |
| `text-red-600/700`, `bg-red-100`, `border-red-200` | `text-error-600`, `bg-error-50`, `border-error-500` |

### 4. **Focus ring standardization**

**Current inconsistent patterns**:
- `focus:ring-2 focus:ring-primary`
- `focus:outline-none focus:ring-2 focus:ring-primary`
- `focus:ring-purple-500`

**Accessibility standard** (from `design-context.yaml:310`):
- **Style**: 2px solid ring with 2px offset
- **Color**: purple-500
- **Rule**: Never use outline-none without replacement

**Standardize to**:
```tsx
focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white
```

Or extract to a focus utility class in Tailwind config:
```ts
// In tailwind.config.ts
import plugin from 'tailwindcss/plugin';

export default {
  // ... rest of config
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.focus-ring': {
          'outline': 'none',
          '&:focus': {
            'outline': 'none',
            'box-shadow': '0 0 0 2px white, 0 0 0 4px #8685ef',  // 2px offset + 2px ring
          },
        },
      })
    }),
  ],
}
```

**Note**: The double box-shadow creates the 2px white offset + 2px purple ring for proper accessibility contrast.

---

## Animation Opportunities

Components that could benefit from our new animation utilities:

1. **Modal backdrop** (`modal.tsx` line 62)
   - Add `animate-fade-in` to backdrop
   - Add `animate-scale-in` to modal content

2. **Upload toast** (`page.tsx` line 278)
   - Add `animate-slide-in-from-top` or `animate-fade-in`

3. **Dropdown menus** (if not already animated by Radix)
   - Verify Radix UI dropdown already has animations

4. **Model cards** (`ModelManager.tsx`)
   - Add subtle `animate-fade-in` when adding new model

---

## Files NOT Requiring Changes

### Story Files (Documentation only)
- `stories/Page.tsx` - Example file, not used in app
- `stories/Header.tsx` - Example file, not used in app
- `stories/Button.tsx` - Example file, not used in app
- `stories/00-Foundation/Colors.stories.tsx` - Intentionally shows hex values
- All other `*.stories.tsx` - Already using design tokens

### Config Files
- `tailwind.config.ts` - This IS the source of truth
- `design-context.yaml` - Documentation

---

## Migration Checklist

### Phase 0: Config and Global Cleanup

⚠️ **CRITICAL ORDER**: Do NOT remove aliases until ALL components have been migrated (Phase 1 & 2 complete)

#### Step 1: `tailwind.config.ts` - Restructure for exports (SAFE - do this first)
- [ ] Extract colors object before config definition
- [ ] Use extracted colors in config: `colors,` instead of inline definition
- [ ] Export colors: `export { colors };`
- [ ] **KEEP aliases for now** (`background`, `primary`, `accent-light`, `accent-dark`)

```typescript
// AFTER STEP 1 (aliases still present)
const colors = {
  neutral: { ... },
  purple: { ... },
  success: { ... },
  warning: { ... },
  error: { ... },
  // Keep these temporarily - remove in Phase 3
  background: '#FAFAFA',
  primary: '#8685ef',
  'accent-light': '#faf8ff',
  'accent-dark': '#dedbee',
};

const config: Config = {
  theme: {
    extend: {
      colors,  // ✅ Use extracted object
    }
  }
};

export { colors };  // ✅ Export for CodeMirror
export default config;
```

⚠️ **Important**: Importing from `tailwind.config.ts` at runtime may break with plugins/Node-only code. If this happens, create `lib/design-tokens.ts` instead and import from both places.

#### Step 2: `styles/globals.css` - Clean up duplicates (SAFE - do this first)
- [ ] **Delete lines 34-48**: Remove duplicate `slideInFromRight` animation
  - This animation is already defined in `tailwind.config.ts` as proper animation utilities
  - No components currently use `.animate-slide-in` class

- [ ] **Update line 20**: Change hardcoded background color
  ```css
  /* BEFORE */
  background-color: #fafafa;

  /* AFTER - Option 1: Remove entirely (let page.tsx control it) */
  /* background-color removed */

  /* AFTER - Option 2: Use Tailwind token reference */
  background-color: theme('colors.neutral.50');
  ```

---

### Phase 1: Color Token Migration (Replace gray-* and aliases)
- [ ] PromptEditor.tsx - Replace all hardcoded hex colors with imported `colors` from config
- [ ] EditorPanel.tsx - Replace `gray-*` with `neutral-*` AND `primary`/`ring-primary` with `purple-500`
- [ ] ModelManager.tsx - Replace `gray-*` with `neutral-*` AND all `primary`/`border-primary`/`ring-primary` with `purple-500`
- [ ] DatasetSelector.tsx - Replace `gray-*` with `neutral-*` AND `text-primary`/`bg-primary` with `purple-500`/`bg-purple-50`
- [ ] **ResultsGrid.tsx** - Replace `gray-*` with `neutral-*` AND `bg-accent-light`/`text-primary`/`border-primary` with proper purple tokens
- [ ] page.tsx - Replace `gray-*` with `neutral-*` AND all `text-primary`/`border-primary` with `purple-500`
- [ ] page.tsx - Update success/error toasts to use semantic tokens
- [ ] layout.tsx - Replace `bg-background` with `bg-neutral-50`
- [ ] Check ui/dropdown-menu.tsx for `gray-*` usage

### Phase 2: Component Standardization
- [ ] EditorPanel.tsx - Replace custom buttons with `<Button>` component
- [ ] ModelManager.tsx - Replace custom buttons with `<Button>` component
- [ ] DatasetSelector.tsx - Replace custom button with `<Button>` component
- [ ] page.tsx - Replace custom buttons with `<Button>` component

### Phase 3: Remove Legacy Aliases (DO LAST - after Phases 1 & 2 complete!)
⚠️ **Only do this after ALL components have been migrated**

- [ ] Verify no components still use `primary`, `accent-light`, `accent-dark`, `background`
  ```bash
  # Run this search to verify:
  grep -r "text-primary\|bg-primary\|border-primary\|ring-primary\|accent-light\|accent-dark\|bg-background" frontend/components frontend/app
  ```
- [ ] Remove aliases from `tailwind.config.ts`:
  ```typescript
  const colors = {
    neutral: { ... },
    purple: { ... },
    success: { ... },
    warning: { ... },
    error: { ... },
    // DELETE these lines:
    // background: '#FAFAFA',
    // primary: '#8685ef',
    // 'accent-light': '#faf8ff',
    // 'accent-dark': '#dedbee',
  };
  ```

### Phase 4: Animation Enhancement
- [ ] Add `animate-fade-in` to modal backdrop
- [ ] Add `animate-scale-in` to modal content
- [ ] Add `animate-slide-in-from-top` to toast notifications
- [ ] Verify dropdown animations

### Phase 5: Focus Ring Standardization
- [ ] Create `.focus-ring` utility class in Tailwind config (if needed)
- [ ] Apply to all interactive elements (buttons, inputs, dropdowns)

---

## Design Decisions (Resolved with Yuki)

### ✅ 1. CodeMirror Theme Approach

**Decision**: Export colors from `tailwind.config.ts` and import them in PromptEditor

**Implementation**:

```typescript
// tailwind.config.ts
const colors = {
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  purple: {
    50: '#FAF8FF',
    100: '#F3EFFF',
    200: '#DEDBEE',
    500: '#8685EF',
    600: '#6B6AD4',
    700: '#5251B0',
  },
  success: {
    50: '#F0FDF4',
    500: '#22C55E',
    600: '#16A34A',
  },
  warning: {
    50: '#FFFBEB',
    500: '#F59E0B',
    600: '#D97706',
  },
  error: {
    50: '#FEF2F2',
    500: '#EF4444',
    600: '#DC2626',
  },
};

const config: Config = {
  theme: {
    extend: {
      colors,  // Use the exported object
      // ... rest of config
    }
  }
};

export { colors };  // Export for use in CodeMirror
export default config;
```

Then in PromptEditor.tsx:
```typescript
import { colors } from '@/tailwind.config';

const customTheme = EditorView.theme({
  '&': {
    border: `1px solid ${colors.neutral[300]}`,
  },
  '&.cm-focused': {
    boxShadow: `0 0 0 2px ${colors.purple[500]}`,
  },
  '.cm-gutters': {
    backgroundColor: colors.neutral[50],
    borderRight: `1px solid ${colors.neutral[200]}`,
    color: colors.neutral[400],  // Updated from purple
  },
  '.cm-prompt-variable': {
    color: colors.purple[500],
    background: colors.purple[50],
  },
  // ... rest of theme
});
```

**Benefits**:
- Single source of truth (no new file needed)
- Type-safe imports
- DRY principle maintained
- Can't drift out of sync

### ✅ 2. Line Numbers Color

**Decision**: Use `neutral-400` instead of adding purple-300

**Reasoning**: Line numbers should be visible but not distracting. Keeping them neutral provides better semantic separation from the purple syntax highlighting.

**Change**:
```typescript
// OLD
'.cm-lineNumbers .cm-gutterElement': {
  color: '#c4b5fd',  // Purple-ish
}

// NEW
'.cm-lineNumbers .cm-gutterElement': {
  color: colors.neutral[400],  // Neutral gray
}
```

### ✅ 3. Background Color Alias

**Decision**: Remove the alias, use `bg-neutral-50` directly

**Reasoning**: Unnecessary indirection. Design system should be clear and direct.

**Changes needed**:
1. Remove from `tailwind.config.ts`:
```typescript
// DELETE this line:
background: '#FAFAFA',  // maps to neutral-50
```

2. Update `page.tsx` line 182:
```typescript
// OLD
<div className="p-6 h-screen w-full bg-background flex flex-col">

// NEW
<div className="p-6 h-screen w-full bg-neutral-50 flex flex-col">
```

### 4. Modal Backdrop Color (Still Open)

**Question**: Currently `bg-black/50` - change to `bg-neutral-900/50` for consistency?

**Recommendation**: Keep as `bg-black/50` - this is a common pattern and the distinction from neutral-900 is negligible visually.

---

## Summary Statistics (CORRECTED)

- **Total files needing updates**: 9 (was 7, missed ResultsGrid.tsx + layout.tsx)
- **High priority**: 5 files (PromptEditor, EditorPanel, ModelManager, DatasetSelector, **ResultsGrid**)
- **Medium priority**: 2 files (page.tsx, layout.tsx)
- **Low priority**: 2 files (modal.tsx, dropdown-menu.tsx)
- **Estimated effort**: 3-4 hours for all migrations (was 2-3, corrected with ResultsGrid)
- **Risk level**: Medium (aliases removal must happen LAST to avoid breaking mid-migration)

---

## Critical Corrections Made

This document was audited and corrected for the following issues:

1. ✅ **ResultsGrid.tsx was missing** from initial audit - now included in Phase 1 (HIGH PRIORITY)
2. ✅ **Alias removal order fixed** - moved to Phase 3 (LAST) instead of Phase 0 (FIRST) to prevent breaking UI
3. ✅ **neutral-800 exists** - corrected false claim that it was missing from palette
4. ✅ **focus-ring utility syntax** - fixed `@apply` usage (doesn't work in `addUtilities`)
5. ✅ **Import warning added** - noted potential issue with importing `tailwind.config.ts` at runtime

---

## Next Steps

1. **Phase 0**: Restructure config for exports, clean up globals.css (SAFE - won't break anything)
2. **Phase 1**: Migrate all components from `gray-*` to `neutral-*` and aliases to direct tokens
3. **Phase 2**: Replace custom buttons with `<Button>` component
4. **Phase 3**: Remove legacy aliases (ONLY after verifying no usage)
5. **Phase 4-5**: Enhancements (animations, focus rings)

**Recommended approach**: Do Phases 0-3 as one commit per phase for easier rollback if needed.
