# Enhanced Focus Mode & Results View Transitions

**Status:** Ready for implementation
**Created:** 2025-10-26

---

## Overview

Transform the compact mode toggle into a smart, auto-triggered system with improved transitions and keyboard controls.

### Current State
- Binary `isCompactMode` toggle (true/false)
- Manual Eye icon button in EditorPanel
- Simple width swap: 100% vs 40%/60%
- Basic CSS transition: `transition-all duration-300`

### Target State
- Two-state view system: `'focus'` | `'balanced'`
- Auto-triggered based on user actions
- Improved dimensions: 65% editor (results hidden) vs 30% editor / 70% results
- Enhanced transitions: spring easing, slide, fade, scale

---

## Requirements

### 1. View State System

**State Management:**
- Replace `isCompactMode: boolean` with `viewMode: 'focus' | 'balanced'`
- Default: `'balanced'`
- Persist preference in localStorage as `viewMode`

**Dimensions:**
- **Focus Mode:** 65% editor width, results panel hidden
- **Balanced Mode:** 30% editor width, 70% results width

### 2. Auto-Trigger Behavior

**Enter Focus Mode (65% editor):**
- User clicks into PromptEditor textarea (detect via `onFocus` event)
- User creates a new prompt
- No results exist yet (`displayRunId === null`)

**Exit to Balanced Mode (30/70 split):**
- User clicks "Run" button

### 3. Enhanced Transitions

**Animation Specifications:**
- Duration: `300ms`
- Easing: Spring physics (cubic-bezier with slight overshoot)
- Effects:
  - Results panel slides in from right
  - Opacity fade: 0 → 1
  - Scale: 0.95 → 1.0 during slide-in

**CSS Requirements:**
- Custom spring easing keyframe: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Separate `transition-transform` and `transition-opacity`

**Visual Polish:**
- No layout jumps or content reflow
- Smooth scroll position preservation
- Lock state during transition (prevent rapid toggles)

### 4. Component Integration

**Focus Detection Flow:**
1. User clicks into CodeMirror editor in `PromptEditor`
2. `PromptEditor` emits `onFocus` event to parent
3. `EditorPanel` forwards event to `page.tsx`
4. `page.tsx` sets `viewMode = 'focus'`

**Run Click Flow:**
1. User clicks "Run" in `EditorPanel`
2. Before executing run, set `viewMode = 'balanced'`
3. Transition completes, then results appear

---

## Implementation Approach

### Phase 1: State Management (`page.tsx`)

**Objective:** Replace binary compact mode with two-state view system

**Tasks:**
1. Replace `isCompactMode` boolean state with `viewMode: 'focus' | 'balanced'` enum
2. Update localStorage key from `isCompactMode` to `viewMode`
3. Update width calculations: Focus = 65% editor, Balanced = 30% editor / 70% results
4. Update conditional rendering to hide results panel entirely in focus mode

**Key Considerations:**
- Default to `'balanced'` mode
- Maintain backward compatibility with existing localStorage (optional: migrate old `isCompactMode` values)

### Phase 2: Auto-Trigger Logic (`page.tsx`)

**Objective:** Automatically switch modes based on user actions

**Tasks:**
1. Create handlers for editor focus events (switch to focus mode)
2. Create handlers for run button clicks (switch to balanced mode)
3. Pass these handlers down to EditorPanel as props
4. Optionally trigger focus mode when no results exist yet

**Key Considerations:**
- Only switch modes if not already in target mode (avoid unnecessary re-renders)
- Ensure handlers are memoized to prevent prop changes

### Phase 3: EditorPanel Updates

**Objective:** Remove manual toggle, add event callbacks

**Tasks:**
1. Remove Eye icon toggle button (currently at lines ~366-379)
2. Remove `onToggleCompactMode` and `isCompactMode` props from interface
3. Add `onEditorFocus` and `onRunClick` callback props
4. Call `onRunClick` before executing run logic
5. Forward `onEditorFocus` to PromptEditor component

**Key Considerations:**
- Maintain all existing run button functionality
- Ensure callbacks are optional (use `?.()` syntax)

### Phase 4: PromptEditor Focus Detection

**Objective:** Detect when user clicks into editor

**Tasks:**
1. Add `onFocus` prop to component interface
2. Attach focus handler to CodeMirror EditorView component
3. Forward focus events to parent via callback

**Key Considerations:**
- Check CodeMirror documentation for correct event prop name
- May need to use `domEventHandlers` or similar CodeMirror API

### Phase 5: Enhanced Transitions

**Objective:** Add spring-based animations using existing Tailwind config

**Tasks:**
1. Add spring easing to `tailwind.config.ts` → `transitionTimingFunction`:
   - `'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)'`
2. Add slide-in keyframe animation to `globals.css`
3. Use existing `duration-comfortable` (300ms) from Tailwind config

**Key Specifications:**
- Spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Slide animation: translateX(100%) → 0, scale(0.95 → 1.0), opacity(0 → 1)
- Duration: Use Tailwind's `duration-comfortable` (already 300ms)

**Key Considerations:**
- Centralize timing values in Tailwind config (avoid duplication)
- Keep animations subtle and professional
- Consider reduced motion preferences

### Phase 6: Apply Transitions (Components)

**Objective:** Apply animation classes to components

**Tasks:**
1. Add spring transition classes to editor panel width changes
2. Add slide-in animation to results panel mount/unmount

**Key Considerations:**
- May need to track mount state or use animation keys
- Test that animations don't interfere with polling updates

### Phase 7: Transition Lock

**Objective:** Prevent rapid mode switching during animations

**Tasks:**
1. Add `isTransitioning` state flag
2. Guard mode change handler to ignore requests during transition
3. Clear flag after 300ms timeout

**Key Considerations:**
- Match timeout duration to CSS transition duration
- Consider using `useRef` instead of state to avoid re-renders

---

## Files to Modify

**IMPORTANT:** Only modify existing files. Do not create any new files.

1. ✅ `frontend/app/page.tsx`
   - State management (viewMode)
   - Auto-trigger logic
   - Width calculations
   - Transition classes

2. ✅ `frontend/components/EditorPanel.tsx`
   - Remove Eye icon toggle
   - Add onEditorFocus prop
   - Add onRunClick notification

3. ✅ `frontend/components/PromptEditor.tsx`
   - Add onFocus event handler
   - Forward to parent

4. ✅ `frontend/tailwind.config.ts`
   - Add `'spring'` to `transitionTimingFunction`

5. ✅ `frontend/styles/globals.css`
   - Slide-in keyframe animation

---

## Testing Checklist

### Functional Tests
- [ ] Focus mode triggers when clicking into editor
- [ ] Balanced mode restores when clicking Run
- [ ] View preference persists in localStorage
- [ ] View preference loads correctly on page refresh

### Visual Tests
- [ ] Transitions use spring easing (slight bounce)
- [ ] Duration is exactly 300ms
- [ ] Results panel slides in from right
- [ ] Results panel fades in (opacity 0 → 1)
- [ ] Results panel scales (0.95 → 1.0)
- [ ] No layout jumping during transitions
- [ ] No content reflow or flicker
- [ ] Editor scrollbar position preserved

### Edge Cases
- [ ] Rapid toggling doesn't break layout (transition lock works)
- [ ] Works when no results exist yet
- [ ] Works when switching between prompts
- [ ] Works after creating new prompt
- [ ] Works with multiple models in results
- [ ] Works with long result content

### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Safari
- [ ] Firefox

---

## Success Metrics

1. **Auto-trigger works:** Users don't need to manually toggle focus mode
2. **Smooth transitions:** 300ms spring animation feels natural
3. **No bugs:** Layout stable during all state changes
4. **Persistent:** View preference survives page refresh

---

## Future Enhancements (Out of Scope)

- Keyboard shortcut: Cmd/Ctrl + S to toggle between modes
- Three-state system: focus / balanced / results (35% / 65%)
- Draggable panel divider for manual resize
- Peek strip in focus mode showing live metrics
- Transition to balanced when first cell completes
- Animation preferences (reduced motion support)
- Smart view switching based on window size

---

## Notes

- Keep transitions subtle and professional (no gimmicks)
- Spring easing adds polish without being distracting
- Auto-triggers should feel predictive, not surprising
- Maintain existing functionality: no regressions allowed
- All changes should be reversible with minimal effort

---

## Design Decisions (Answered)

1. **Visual indicator in focus mode?**
   → No visual indicator needed. The absence of results panel is clear enough.

2. **Keyboard shortcut to toggle?**
   → Not in this iteration. Keep it simple with auto-triggers only.

3. **Animate editor width or snap instantly?**
   → Animate with spring easing. Apply `transition-spring` class to editor panel.

4. **Stagger result cards?**
   → Removed from scope. Adds complexity without significant UX benefit.
