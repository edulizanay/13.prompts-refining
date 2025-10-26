# Frontend Unit Tests Proposal

## Executive Summary

This document proposes a comprehensive unit testing strategy for the Prompt Refinement UI frontend. The analysis identifies **missing test coverage** across components, utilities, and integration points, categorized by priority and business value.

**Current Coverage:**
- ✅ `PromptEditor.test.tsx` - CodeMirror integration tests
- ✅ `utils.test.ts` - Complete utility function coverage
- ✅ `mockRepo.temp.test.ts` - Complete localStorage CRUD coverage

**Testing Philosophy:**
Only test **business-critical logic** and **user-facing behavior**. Avoid testing implementation details, third-party libraries, or purely presentational components without logic.

---

## Priority 1: Critical Business Logic (MUST HAVE)

### 1.1 EditorPanel Component (`EditorPanel.test.tsx`)

**File:** `frontend/components/__tests__/EditorPanel.test.tsx`

**Why Critical:**
- Orchestrates core user workflows (prompt creation, editing, running)
- Contains complex state management and validation logic
- Handles run execution and version management
- Multiple failure modes that could break the app

**Test Coverage:**

#### Prompt Management
- [ ] **Prompt selection** - selecting prompts updates current prompt and triggers callback
- [ ] **Prompt creation** - creates new prompt via modal and switches to it
- [ ] **Prompt renaming** - updates prompt name and resets version counter to 1
- [ ] **Prompt name validation** - blocks empty prompt names

#### Text Editing & Versioning
- [ ] **Text updates** - onChange triggers updatePrompt with new text
- [ ] **Version counter increment** - only bumps on Run (not on every edit)
- [ ] **textIsChangedRef tracking** - tracks if text changed since last run
- [ ] **Rename resets version** - renaming resets version_counter to 1

#### Run Execution
- [ ] **Validation before run** - validates placeholders match dataset columns
- [ ] **Missing dataset validation** - blocks run when generator needs variables but no dataset selected
- [ ] **Missing model validation** - blocks run when no models selected
- [ ] **Grader validation** - validates grader has required variables
- [ ] **Error dialog display** - shows validation errors in modal
- [ ] **Run disabled during execution** - Run button disabled when activeRunId exists
- [ ] **Run callback integration** - calls onRunClick, onActiveRunIdChange correctly

#### Dataset Integration
- [ ] **Dataset selection** - selecting dataset updates state and calls callback
- [ ] **Dataset deselection** - allows clearing dataset selection

#### Placeholder Extraction
- [ ] **Variable chips display** - extracts and displays {{variables}} as chips
- [ ] **No variables case** - doesn't show variable section when no placeholders

#### Ref Exposure
- [ ] **triggerRun via ref** - imperative handle exposes triggerRun for keyboard shortcuts

**Edge Cases:**
- Switching prompts mid-edit
- Rapid prompt switching
- Renaming while run is active
- Creating prompt with same name

---

### 1.2 ResultsGrid Component (`ResultsGrid.test.tsx`)

**File:** `frontend/components/__tests__/ResultsGrid.test.tsx`

**Why Critical:**
- Most complex component with multiple sub-components
- Handles real-time cell updates and polling
- Manages model columns (add/edit/remove)
- Contains critical business logic for metrics and grading

**Test Coverage:**

#### Model Column Management
- [ ] **Add model** - adds new model column (up to MAX_MODELS=4)
- [ ] **Remove model** - removes model and shifts column indices
- [ ] **Edit model** - replaces model and clears old cells
- [ ] **Max models enforcement** - blocks adding >4 models
- [ ] **Minimum models enforcement** - prevents removing last model
- [ ] **Column index shifting** - correctly shifts cells when column removed
- [ ] **Duplicate model support** - allows same model in different columns

#### Cell Rendering & State
- [ ] **Cell polling** - polls cells every 500ms when run exists
- [ ] **Cell status rendering** - renders different states (idle, running, ok, error, malformed)
- [ ] **Loading skeleton** - shows skeleton for running/idle cells
- [ ] **Error cell styling** - red border for error cells
- [ ] **Malformed cell styling** - warning styling for malformed cells
- [ ] **No data handling** - shows "No data" when cell doesn't match model_id

#### Metric Display
- [ ] **Grade metric** - displays formatted grade percentage
- [ ] **Tokens metric** - displays "input | output" format
- [ ] **Cost metric** - displays currency format
- [ ] **Latency metric** - displays milliseconds

#### Grader Overlay
- [ ] **Toggle grader overlay** - clicking grade badge shows grader output
- [ ] **Close overlay on mouse leave** - overlay closes when mouse exits cell
- [ ] **Grader badge display** - shows colored badge when grader present

#### Manual Grading
- [ ] **Manual grade toggle** - cycles null → pass → fail → pass
- [ ] **Manual grade precedence** - manual_grade overrides graded_value
- [ ] **Thumbs icons** - shows thumbs up/down based on manual grade

#### Cell Expansion
- [ ] **Expand modal** - clicking cell opens expansion modal
- [ ] **Modal content** - displays full output, metadata, and grader info
- [ ] **Parsed vs raw toggle** - respects showParsedOnly flag
- [ ] **Escape to close** - Esc key closes modal

#### Re-run Functionality
- [ ] **Re-run button visibility** - shows on hover for terminal cells in active run
- [ ] **Re-run disabled for historical** - hidden in historical view
- [ ] **Re-run execution** - marks cell as running, generates new data
- [ ] **Cell update propagation** - onRerun callback updates parent state

#### Summary Row
- [ ] **Grade average** - calculates correct average grade
- [ ] **Tokens average** - calculates correct average tokens (input | output)
- [ ] **Cost average** - calculates correct average cost
- [ ] **Latency average** - calculates correct average latency
- [ ] **Only OK cells** - excludes error/malformed cells from averages
- [ ] **Model ID filtering** - only includes cells matching column's model_id

#### Edge Cases
- Empty dataset (row_count = 0)
- No models selected
- Editing model during active run
- Removing model with existing cells
- Cell model_id mismatch (stale data)
- Multiple cells updating simultaneously

---

### 1.3 mockRunExecutor Logic (`mockRunExecutor.temp.test.tsx`)

**File:** `frontend/lib/__tests__/mockRunExecutor.temp.test.tsx`

**Why Critical:**
- Core execution engine (even though temporary)
- Complex async orchestration
- Error handling and grader integration
- Will serve as reference for real executor in Phase 2

**Test Coverage:**

#### Mock Data Generation
- [ ] **generateMockCell success** - generates valid cell with random metrics
- [ ] **generateMockCell error** - ~5% error rate, returns error state
- [ ] **generateMockGrader** - generates random grader responses (Yes/No/1-5)

#### Execution Flow
- [ ] **Sequential cell execution** - executes cells row-by-row, column-by-column
- [ ] **Cell state progression** - idle → running → ok/error
- [ ] **Grader execution** - runs grader after successful generator execution
- [ ] **No grader when error** - skips grader for error cells
- [ ] **Callbacks invoked** - onCellUpdate called for each state change
- [ ] **Completion callback** - onComplete called after all cells finish

#### Grading Logic
- [ ] **Grader delay simulation** - adds realistic delay for grader execution
- [ ] **Grade normalization** - correctly normalizes Yes/No/1-5 to 0..1
- [ ] **Grader output format** - generates `<thinking>...</thinking>\n<response>...</response>`
- [ ] **Grader fields populated** - sets graded_value, grader_full_raw, grader_parsed

#### Error Handling
- [ ] **Execution errors caught** - try/catch prevents run from hanging
- [ ] **Partial completion** - completes successfully even if some cells error
- [ ] **onComplete always called** - ensures cleanup even on error

---

## Priority 2: Important UI Components (SHOULD HAVE)

### 2.1 DatasetSelector Component (`DatasetSelector.test.tsx`)

**File:** `frontend/components/__tests__/DatasetSelector.test.tsx`

**Why Important:**
- User-facing dataset management
- Preview modal interaction
- Relatively simple but user-critical

**Test Coverage:**
- [ ] **Dataset selection display** - shows selected dataset name and row count
- [ ] **Preview button visibility** - only shows when dataset selected
- [ ] **Preview modal** - opens modal with dataset preview table
- [ ] **Preview table rendering** - renders headers and rows correctly
- [ ] **Row count display** - shows "X of Y rows" in footer
- [ ] **Close modal** - Esc and backdrop click close modal
- [ ] **Not mounted state** - returns null until mounted

**Edge Cases:**
- No dataset selected
- Dataset with 50+ rows (preview cap)
- Very wide datasets (many columns)

---

### 2.2 Main Page Orchestration (`page.test.tsx`)

**File:** `frontend/app/__tests__/page.test.tsx`

**Why Important:**
- Application entry point
- State coordination between panels
- Keyboard shortcuts and user interactions
- View mode transitions

**Test Coverage:**

#### Initialization
- [ ] **Seed data initialization** - calls initializeSeedData on mount
- [ ] **Model deduplication** - calls deduplicateModels on mount
- [ ] **UI state restoration** - loads activeRunId from localStorage
- [ ] **View mode restoration** - loads saved view mode preference
- [ ] **Default model selection** - selects first model if none selected

#### View Mode Transitions
- [ ] **Focus mode on editor focus** - switches to 65%/35% layout
- [ ] **Balanced mode on editor blur** - switches to 30%/70% layout
- [ ] **Balanced mode on run click** - switches to balanced when Run clicked
- [ ] **Transition lock** - prevents rapid mode switching during animation
- [ ] **localStorage persistence** - saves view mode preference

#### Metric View Cycling
- [ ] **Cycle through metrics** - grade → tokens → cost → latency → grade
- [ ] **Fade transition** - applies fade effect during metric change

#### File Upload
- [ ] **CSV file parsing** - parses CSV and creates dataset
- [ ] **JSON file parsing** - parses JSON and creates dataset
- [ ] **Upload success toast** - shows success message for 3 seconds
- [ ] **Upload error toast** - shows error message on parse failure
- [ ] **File input reset** - clears file input after upload
- [ ] **Loading state** - disables upload button during processing

#### Keyboard Shortcuts
- [ ] **Cmd+Enter (Mac)** - triggers run via editorPanelRef
- [ ] **Ctrl+Enter (Windows/Linux)** - triggers run via editorPanelRef
- [ ] **Shortcut prevented during run** - no-op when run active

#### State Synchronization
- [ ] **displayRunId tracks activeRunId** - updates when run starts
- [ ] **displayRunId persists** - keeps showing results after run completes
- [ ] **currentRun updates** - loads run data when displayRunId changes
- [ ] **currentDataset updates** - loads dataset when run has dataset_id

#### Grader Selection
- [ ] **Grader dropdown** - lists all grader-type prompts
- [ ] **No grader option** - allows clearing grader selection
- [ ] **Selected grader display** - shows grader name when selected

**Edge Cases:**
- Upload during active run
- Rapid view mode toggling
- Keyboard shortcut spam
- File upload failure

---

## Priority 3: UI Primitives (NICE TO HAVE)

These components are relatively simple and mostly presentational, but testing ensures design system consistency.

### 3.1 Modal Component (`modal.test.tsx`)

**File:** `frontend/components/ui/__tests__/modal.test.tsx`

**Test Coverage:**
- [ ] **Renders when open** - modal displays when isOpen=true
- [ ] **Hidden when closed** - modal hidden when isOpen=false
- [ ] **Escape key closes** - Esc triggers onClose when hasEscapeClose=true
- [ ] **Escape disabled** - Esc doesn't close when hasEscapeClose=false
- [ ] **Backdrop click closes** - clicking backdrop triggers onClose when hasBackdropClose=true
- [ ] **Backdrop disabled** - clicking backdrop doesn't close when hasBackdropClose=false
- [ ] **Size variants** - applies correct max-width for small/medium/large
- [ ] **Custom className** - merges custom className prop
- [ ] **ARIA attributes** - has role="dialog" and aria-modal="true"

---

### 3.2 Button Component (`button.test.tsx`)

**File:** `frontend/components/ui/__tests__/button.test.tsx`

**Test Coverage:**
- [ ] **Variant styles** - applies correct classes for primary/secondary/outline/ghost/destructive
- [ ] **Size styles** - applies correct classes for small/medium/large
- [ ] **Disabled state** - applies disabled styles and cursor
- [ ] **Custom className** - merges custom className prop
- [ ] **onClick handler** - triggers onClick callback
- [ ] **Focus ring** - applies focus:ring-2 focus:ring-purple-500

**Note:** Low priority since it's a pure presentational component with minimal logic.

---

## Priority 4: NOT Recommended for Unit Testing

### 4.1 Simple UI Primitives
**Files:** `Spinner.tsx`, `Badge.tsx`, `Kbd.tsx`, `DropdownMenu.tsx`

**Reason:** These are either:
- Pure presentational components with no logic
- Wrapper components around third-party libraries (e.g., Radix UI for DropdownMenu)
- Minimal user-facing value from testing

**Alternative:** Visual regression testing (Storybook + Chromatic) would be more appropriate.

---

### 4.2 Types File
**File:** `types.ts`

**Reason:** Pure TypeScript type definitions. TypeScript compiler already validates these. No runtime logic to test.

---

## Test Infrastructure Recommendations

### Current Setup (Good)
✅ Jest with Next.js integration
✅ `@testing-library/react` and `@testing-library/jest-dom`
✅ jsdom environment for DOM testing
✅ Path aliasing configured (`@/` → `<rootDir>/`)

### Suggested Additions

1. **`@testing-library/user-event`** - Better user interaction simulation
   ```bash
   npm install --save-dev @testing-library/user-event
   ```

2. **Mock localStorage** - Already used in mockRepo tests, consider extracting to setup file
   ```typescript
   // jest.setup.js - add global localStorage mock
   ```

3. **Mock IntersectionObserver** - Required for some UI components
   ```typescript
   // jest.setup.js
   global.IntersectionObserver = class IntersectionObserver {
     observe() {}
     unobserve() {}
     disconnect() {}
   };
   ```

4. **Testing async timers** - Use `jest.useFakeTimers()` for polling/debounce tests

5. **Snapshot testing** (optional) - For component structure validation, but use sparingly

---

## Test Organization Strategy

```
frontend/
├─ components/
│  ├─ __tests__/
│  │  ├─ PromptEditor.test.tsx          ✅ Exists
│  │  ├─ EditorPanel.test.tsx           ❌ Create (Priority 1)
│  │  ├─ DatasetSelector.test.tsx       ❌ Create (Priority 2)
│  │  └─ ResultsGrid.test.tsx           ❌ Create (Priority 1)
│  └─ ui/
│     └─ __tests__/
│        ├─ modal.test.tsx               ❌ Create (Priority 3)
│        └─ button.test.tsx              ❌ Create (Priority 3)
├─ lib/
│  ├─ __tests__/
│  │  └─ mockRunExecutor.temp.test.tsx  ❌ Create (Priority 1)
│  ├─ utils.test.ts                      ✅ Exists
│  └─ mockRepo.temp.test.ts              ✅ Exists
└─ app/
   └─ __tests__/
      └─ page.test.tsx                   ❌ Create (Priority 2)
```

---

## Existing Tests That Need Updates

### ❗ PromptEditor.test.tsx - Enhancement Opportunities

**Current:** Tests basic CodeMirror integration
**Missing:**
- [ ] **onFocus/onBlur callbacks** - Test that focus/blur events trigger callbacks
- [ ] **Keyboard interactions** - Test Cmd+Enter handling (if applicable)
- [ ] **Value synchronization edge cases** - Rapid prop changes

**File:** `frontend/components/__tests__/PromptEditor.test.tsx`

---

## Testing Anti-Patterns to Avoid

❌ **Don't test:**
- Third-party library internals (CodeMirror, Radix UI)
- CSS classes directly (test behavior, not styling)
- Implementation details (internal state variable names)
- Trivial getters/setters without logic
- Pure type definitions

✅ **Do test:**
- User-facing behavior ("when I click X, Y happens")
- Business logic and validation rules
- Error states and edge cases
- Async flows and race conditions
- Integration between components (prop drilling, callbacks)

---

## Estimated Test File Sizes

Based on complexity analysis:

| File | Lines of Tests | Effort | Priority |
|------|----------------|--------|----------|
| `EditorPanel.test.tsx` | 400-500 | High | 1 |
| `ResultsGrid.test.tsx` | 600-800 | Very High | 1 |
| `mockRunExecutor.temp.test.tsx` | 200-300 | Medium | 1 |
| `DatasetSelector.test.tsx` | 100-150 | Low | 2 |
| `page.test.tsx` | 300-400 | Medium | 2 |
| `modal.test.tsx` | 100-150 | Low | 3 |
| `button.test.tsx` | 80-100 | Low | 3 |
| **TOTAL** | **1,780-2,400** | | |

---

## Implementation Order Recommendation

### Phase 1: Core Business Logic (Week 1)
1. `mockRunExecutor.temp.test.tsx` - Foundation for execution flow
2. `EditorPanel.test.tsx` - Core user workflows
3. `ResultsGrid.test.tsx` - Complex rendering and interaction

### Phase 2: Integration & Orchestration (Week 2)
4. `page.test.tsx` - Application-level coordination
5. `DatasetSelector.test.tsx` - Dataset management

### Phase 3: UI Polish (Week 3, Optional)
6. `modal.test.tsx` - Design system consistency
7. `button.test.tsx` - Design system consistency
8. Update `PromptEditor.test.tsx` - Enhanced coverage

---

## Success Metrics

**Coverage Targets:**
- **Statements:** 80%+ (currently ~40% estimated)
- **Branches:** 75%+ (focus on edge cases)
- **Functions:** 85%+ (all public APIs)
- **Lines:** 80%+ (excluding temp files)

**Quality Metrics:**
- All P1 tests passing before Phase 2 backend migration
- Zero false positives (flaky tests)
- Tests run in <30 seconds total
- Each test file can run in isolation

---

## Migration Notes for Phase 2

**Files marked `.temp.ts`:**
- `mockRepo.temp.test.ts` - Will be replaced with real DB tests
- `mockRunExecutor.temp.test.tsx` - Will be replaced with real executor tests

**Keep these test patterns:**
- Async execution flow testing
- Cell state progression testing
- Error handling patterns
- Grader integration patterns

**Strategy:** Write new tests for real implementations, then archive temp tests for reference.

---

## Appendix: Test Template Example

```typescript
// frontend/components/__tests__/EditorPanel.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { EditorPanel } from '../EditorPanel';
import * as mockRepo from '@/lib/mockRepo.temp';

// Mock dependencies
jest.mock('@/lib/mockRepo.temp');
jest.mock('@/lib/mockRunExecutor.temp');

describe('EditorPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup common mocks
  });

  describe('Prompt Selection', () => {
    it('should load first prompt on mount', () => {
      // Test implementation
    });

    it('should switch prompts when dropdown selection changes', () => {
      // Test implementation
    });
  });

  describe('Run Execution', () => {
    it('should validate dataset columns before run', () => {
      // Test implementation
    });

    it('should block run when no models selected', () => {
      // Test implementation
    });
  });

  // ... more test suites
});
```

---

## Conclusion

This proposal outlines **7 new test files** covering the most critical business logic and user workflows. Implementing Priority 1 and Priority 2 tests will provide **robust coverage** for the core application functionality while avoiding over-testing of presentational components.

**Recommended Start:** Begin with `mockRunExecutor.temp.test.tsx` to establish async testing patterns, then move to `EditorPanel.test.tsx` and `ResultsGrid.test.tsx` to cover the main user flows.

**Total Estimated Effort:** 2-3 weeks for complete implementation (P1-P3) with thorough test coverage and edge case handling.
