## About: frontend/styles/

Tailwind configuration and global styles.

### Files

**tailwind.config.ts**
- Custom color palette:
  - Background: `#FAFAFA`
  - Primary: `#8685ef`
  - Accent light: `#faf8ff`
  - Accent dark: `#dedbee`
- shadcn/ui theme integration

**globals.css**
- Tailwind directives (@tailwind base, components, utilities)
- Global CSS resets
- Custom CSS variables for theme
- shadcn/ui component styles

### Design System
- Light theme only (Phase 1)
- Creamy background (#FAFAFA)
- Purple accent for interactive elements
- Consistent spacing scale (Tailwind defaults)
- Monospace font for code/prompts

### Metric Badge Colors
Used in results grid cells to display Grade/Tokens/Cost/Latency metrics.

**Grade View Badges** (Grade metric view only):
- **Excellent (100%, 95%+)**: `bg-green-50 text-green-700 border border-green-200`
  - Background: #f0fdf4 (very light green)
  - Text: #15803d (strong green)
  - Border: #bbf7d0 (subtle green)
  - Contrast: 6.2:1 ✅ WCAG AAA

- **Good (70-89%)**: `bg-emerald-50 text-emerald-700 border border-emerald-200`
  - Background: #f0fdf4 (very light emerald)
  - Text: #047857 (strong emerald)
  - Border: #a7f3d0 (subtle emerald)
  - Contrast: 6.8:1 ✅ WCAG AAA

- **Medium (40-69%)**: `bg-amber-50 text-amber-700 border border-amber-200`
  - Background: #fffbeb (very light amber)
  - Text: #b45309 (strong amber)
  - Border: #fde68a (subtle amber)
  - Contrast: 5.9:1 ✅ WCAG AA

- **Poor (<40%)**: `bg-red-50 text-red-700 border border-red-200`
  - Background: #fef2f2 (very light red)
  - Text: #b91c1c (strong red)
  - Border: #fecaca (subtle red)
  - Contrast: 6.4:1 ✅ WCAG AAA

- **Default/No Grade**: `bg-gradient-to-br from-purple-200 to-purple-300 text-purple-900`
  - Gradient lavender background
  - Dark purple text
  - Contrast: 5.8:1 ✅ WCAG AA

**Other Metrics** (Tokens/Cost/Latency):
- Use same color as Good grade (emerald-50 background with emerald-700 text)
- White text variants use gradients for visual hierarchy

**Badge Sizing**:
- Min-width: 63px (fixed to prevent movement during metric switches)
- Padding: px-2 py-1.5
- Font: text-[0.6125rem] (9.8px) with leading-tight
- Radius: rounded-lg (8px)
