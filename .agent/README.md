# Prompt Refinement UI - Documentation Index

This directory contains all project documentation for the Prompt Refinement UI.

## 📁 Documentation Structure

```
.agent/ (787 lines)
├── README.md                      # This file - documentation index (409 lines)
├── system/                        # Current state of the system (378 lines)
│   └── project_architecture.md   # Complete technical architecture
└── tasks/                         # Feature PRDs & implementation plans (0 lines)
```

**Current Phase**: Phase 1 (Frontend MVP) ✅ Complete
**Next Phase**: Phase 2 (Backend Integration) - Scheduled tomorrow

---

## 🧭 Quick Navigation

**Looking for...** | **Check...**
---|---
What this project does | [Repository Overview](#repository-overview)
Folder structure explained | [Root Directory](#root-directory-structure), [Frontend](#frontend---nextjs-application), [Backend](#backend---backend-implementation)
Tech stack (frontend/backend) | [project_architecture.md](system/project_architecture.md#tech-stack)
Data models and interfaces | [project_architecture.md](system/project_architecture.md#core-concepts)
What's temporary vs permanent | [Temporary vs Permanent](#temporary-vs-permanent-files), [project_architecture.md](system/project_architecture.md#temporary-vs-permanent-components)
Phase 2 migration plan | [Migration Plan](#phase-2-migration-plan), [project_architecture.md](system/project_architecture.md#phase-2-migration-plan)
Where to add UI components | [Quick Reference](#where-to-find-things)
How to modify data types | [Quick Reference](#where-to-find-things)
Design tokens and styling | `frontend/tailwind.config.ts`, [design-context.yaml](../design-context.yaml)
Testing strategy | [project_architecture.md](system/project_architecture.md#testing-strategy)
Development commands | [Key Commands](#key-commands)

---

## Repository Overview

**Prompt Refinement UI** - A two-panel app for testing LLM prompts across multiple models with dataset-driven execution.

### What This System Does
- Edit and version **generator prompts** (produce outputs) and **grader prompts** (evaluate outputs)
- Run prompts against **multiple LLM models** side-by-side (OpenAI, Anthropic, etc.)
- Execute prompts across entire **datasets** (CSV/JSON) with variable substitution
- Compare results with **multiple metrics**: grade, tokens, cost, latency
- Manually grade outputs or use automated grader prompts
- Track prompt versions automatically on each run

---

## Root Directory Structure

```
/
├── frontend/           # Next.js application (Phase 1 complete)
├── backend/            # Backend implementation (Phase 2 - currently empty)
├── .agent/             # Project documentation (YOU ARE HERE)
├── .claude/            # Claude Code configuration
├── .git/               # Git repository
├── .next/              # Next.js build output (generated)
├── .vscode/            # VS Code settings
├── node_modules/       # Dependencies (generated)
├── specs.md            # Complete product specification
├── design-context.yaml # Design system tokens
├── CLAUDE.md           # Project-specific AI instructions
├── package.json        # Workspace root scripts
└── package-lock.json   # Dependency lock file
```

## `/frontend` - Next.js Application

**Purpose**: Complete UI implementation with mock data layer

### Directory Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main page: two-panel layout orchestration
│
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── modal.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── badge.tsx
│   │   ├── spinner.tsx
│   │   └── kbd.tsx
│   │
│   ├── EditorPanel.tsx          # Left panel: prompt editing, autosave on blur
│   ├── PromptEditor.tsx         # CodeMirror wrapper, Ctrl+Shift+Z wrap toggle
│   ├── DatasetSelector.tsx      # Read-only dataset preview
│   ├── ResultsGrid.tsx          # Right panel: results table + model management
│   │
│   └── __tests__/               # Component unit tests
│       ├── EditorPanel.test.tsx
│       ├── PromptEditor.test.tsx
│       └── ResultsGrid.test.tsx
│
├── lib/                   # Utilities and data layer
│   ├── types.ts                 # TypeScript interfaces (PERMANENT)
│   ├── utils.ts                 # Helper functions (PERMANENT)
│   ├── utils.test.ts            # Helper tests
│   ├── mockRepo.temp.ts         # localStorage CRUD (TEMPORARY)
│   ├── mockRepo.temp.test.ts    # Mock repo tests (TEMPORARY)
│   └── mockRunExecutor.temp.ts  # Mock async execution (TEMPORARY)
│
├── stories/               # Storybook component development
│   ├── 00-Foundation/    # Design tokens, colors, icons, animations
│   ├── 01-Components/    # Component stories (Button, Badge, Dropdown)
│   └── *.stories.ts      # Individual story files
│
├── styles/                # Global styles
│   └── README.md         # Style guide
│
├── .storybook/           # Storybook configuration
│   ├── main.ts
│   └── preview.ts
│
├── public/               # Static assets
│
├── tailwind.config.ts    # Design tokens and theme
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Test runner configuration
├── next.config.js        # Next.js configuration
├── components.json       # shadcn/ui configuration
└── package.json          # Frontend dependencies
```

### Key Files Explained

#### Application Entry Points
- **`app/page.tsx`** - Main orchestration: state management, view modes, toolbar, keyboard shortcuts (Cmd+Enter)
- **`app/layout.tsx`** - Root layout with Tailwind CSS and global providers

#### Feature Components
- **`EditorPanel.tsx`** - Prompt selection, inline editing (no type badge displayed), version display, dataset preview, Run button. **Autosave on blur, prompt switch, and before run.**
- **`PromptEditor.tsx`** - CodeMirror integration with syntax highlighting for `{{variables}}`, `<tags>`, "json". **Ctrl+Shift+Z** toggles line wrapping (not Cmd).
- **`DatasetSelector.tsx`** - **Read-only** dataset preview modal (first 50 rows). No selection or upload UI; upload happens in page.tsx toolbar.
- **`ResultsGrid.tsx`** - Table rendering, **embedded model management** (add/edit/remove, max 4). Cell states, metric badges, manual grading, grader overlay. **Editing a model clears stale cells for that column; removing a model shifts column indices.**

#### Data Layer (TEMPORARY - Delete in Phase 2)
- **`lib/mockRepo.temp.ts`** - localStorage CRUD for all entities, seed data, version logic
- **`lib/mockRunExecutor.temp.ts`** - Simulated async execution with random delays/outputs

#### Data Layer (PERMANENT - Keeps in Phase 2)
- **`lib/types.ts`** - TypeScript interfaces matching backend schema
- **`lib/utils.ts`** - Business logic: placeholder extraction, validation, formatting, grade colors

---

## `/backend` - Backend Implementation

**Purpose**: Database, API, workers, provider integrations

**Current Status**: Empty placeholder (Phase 2 starts tomorrow)

### Planned Structure (Phase 2)

```
backend/
├── supabase/              # Database and migrations
│   ├── migrations/       # SQL migration files
│   └── config.toml       # Supabase configuration
│
├── api/                   # API routes or Edge Functions
│   ├── runs.ts           # POST /runs - Create run
│   ├── execute.ts        # POST /execute - Enqueue execution
│   └── cell-rerun.ts     # POST /cell/rerun - Re-run cell
│
├── workers/               # Async execution
│   ├── queue.ts          # Job queue implementation
│   └── executor.ts       # Per-cell execution with retry
│
├── providers/             # LLM provider adapters
│   ├── openai.ts         # OpenAI adapter
│   └── anthropic.ts      # Anthropic adapter
│
└── utils/                 # Backend utilities
    ├── cost.ts           # Cost calculation
    ├── cache.ts          # Caching layer
    └── validation.ts     # Input validation
```

**What Gets Replaced**: See [Migration Plan](#phase-2-migration-plan)

---

## `/.agent` - Project Documentation

**Purpose**: System architecture, SOPs, and task PRDs

```
.agent/
├── README.md                      # THIS FILE - Directory guide
├── system/                        # Architecture documentation
│   └── project_architecture.md   # Complete technical overview
└── tasks/                         # Feature PRDs
    └── (individual task docs)
```

### Documentation Files

- **`README.md`** - Repository structure and directory guide
- **`system/project_architecture.md`** - Tech stack, data models, UI layout, migration plan
- **`tasks/`** - Feature-specific PRDs with requirements and implementation plans

---

## Root Configuration Files

### Product Specification
- **`specs.md`** - Complete product requirements, UX layout, backend architecture, database schema

### Design System
- **`design-context.yaml`** - Design tokens, color palette, spacing, typography
- **`frontend/tailwind.config.ts`** - Tailwind CSS configuration with custom tokens

### Development
- **`package.json`** - Workspace scripts (dev, build, test)
- **`CLAUDE.md`** - Project-specific AI instructions
- **`.claude/`** - Claude Code configuration (commands, skills)
- **`.vscode/`** - VS Code settings

---

## Temporary vs Permanent Files

### TEMPORARY (Delete Tomorrow in Phase 2)

**Purpose**: Allow UI development without backend dependency

Files marked `*.temp.ts`:
- `frontend/lib/mockRepo.temp.ts`
- `frontend/lib/mockRepo.temp.test.ts`
- `frontend/lib/mockRunExecutor.temp.ts`

**Replacement**: Supabase client, API calls, worker queue

### PERMANENT (Stays in Phase 2+)

**Everything else**, including:
- All UI components (`frontend/components/`)
- TypeScript interfaces (`frontend/lib/types.ts`)
- Helper utilities (`frontend/lib/utils.ts`)
- Design system and styles
- Test infrastructure

## Phase 2 Migration Plan

### What Gets Deleted Tomorrow

```bash
# Remove temp files
rm frontend/lib/mockRepo.temp.ts
rm frontend/lib/mockRepo.temp.test.ts
rm frontend/lib/mockRunExecutor.temp.ts
```

### What Gets Added

1. **Supabase setup**
   - Install `@supabase/supabase-js`
   - Create `backend/supabase/` with migrations
   - Add environment variables

2. **Backend structure**
   - Create `backend/api/` for endpoints
   - Create `backend/workers/` for queue
   - Create `backend/providers/` for LLM adapters

3. **Frontend updates**
   - Replace `mockRepo.temp.ts` calls with Supabase client
   - Replace `mockRunExecutor.temp.ts` with API calls
   - Wire Realtime subscriptions

**Estimated effort**: ~400 lines deleted, ~2000 lines added, 2-3 days

---

## Quick Reference

### Where to Find Things

| What | Where |
|------|-------|
| Add a new UI component | `frontend/components/` |
| Modify data types | `frontend/lib/types.ts` |
| Add helper function | `frontend/lib/utils.ts` |
| Write component tests | `frontend/components/__tests__/` |
| Update design tokens | `frontend/tailwind.config.ts` |
| Change app layout | `frontend/app/page.tsx` |
| Add Storybook story | `frontend/stories/` |
| Mock data logic (temp) | `frontend/lib/mockRepo.temp.ts` |

### Key Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run test             # Run tests
npm run test:watch       # Watch mode
npm run storybook        # Start Storybook (localhost:6006)
```

---

## Additional Documentation

### Architecture & Design
- **[system/project_architecture.md](system/project_architecture.md)** - Complete technical architecture, data models, migration guide
- **[specs.md](../specs.md)** - Product specification and requirements
- **[design-context.yaml](../design-context.yaml)** - Design system tokens

### Testing & Development
- **[frontend-unit-tests-proposal.md](../frontend-unit-tests-proposal.md)** - Testing strategy
- **[CLAUDE.md](../CLAUDE.md)** - AI development instructions

---

## 🎯 For New Engineers

**Getting Started (Read in This Order):**
1. **[README.md](#repository-overview)** (this file) - Understand folder structure and where things live
2. **[project_architecture.md](system/project_architecture.md)** - Tech stack, data models, UI layout, component responsibilities
3. **[specs.md](../specs.md)** - Complete product specification and requirements
4. **Explore `frontend/components/`** - See how UI components are structured
5. **Check `frontend/lib/types.ts`** - Understand data contracts

**For Development:**
1. Check [Where to Find Things](#where-to-find-things) table for common tasks
2. Review relevant system docs before coding
3. Write tests alongside your code (see `frontend/components/__tests__/`)
4. Update docs when you change architecture

**Important Files to Know:**
- `frontend/lib/mockRepo.temp.ts` - **TEMPORARY** data layer (delete tomorrow)
- `frontend/lib/mockRunExecutor.temp.ts` - **TEMPORARY** execution (delete tomorrow)
- `frontend/lib/types.ts` - **PERMANENT** data contracts
- `frontend/lib/utils.ts` - **PERMANENT** business logic

---

## 📝 Documentation Conventions

### When to Update Docs

- **After implementing a feature** → Update `system/project_architecture.md` to reflect new state
- **Before starting a feature** → Check if task exists in `tasks/`, create if needed
- **When changing architecture** → Update `project_architecture.md` (requires explicit permission from Edu)
- **When modifying data schema** → Update both `types.ts` and architecture doc
- **When adding components** → Update architecture doc's component list
- **After Phase 2 migration** → Remove TEMPORARY file references, update migration status

### Keep Docs Evergreen

- Docs describe **current state**, not history
- Remove outdated information immediately
- Update examples to match current code
- No "old way" vs "new way" comparisons
- No temporal language ("recently", "new", "old")

---

## 📊 Recent Major Changes

**Phase 1 Complete (October 26, 2025)**:
- ✅ Two-panel UI with dynamic view modes (focus/balanced)
- ✅ CodeMirror integration with syntax highlighting
- ✅ Dataset upload and preview (CSV/JSON)
- ✅ Multi-model comparison (max 4 models)
- ✅ Mock async execution with cell states
- ✅ Metric cycling (grade, tokens, cost, latency)
- ✅ Manual and automated grading
- ✅ Per-cell re-run capability
- ✅ All component unit tests passing

**Tomorrow (Phase 2 - Backend Integration)**:
- 🔄 Delete temp files (`mockRepo.temp.ts`, `mockRunExecutor.temp.ts`)
- 🔄 Install Supabase and create database schema
- 🔄 Add authentication (Supabase Auth)
- 🔄 Implement real LLM provider calls (OpenAI, Anthropic)
- 🔄 Add worker queue with retry logic
- 🔄 Wire Realtime subscriptions for cell updates

---

## 📚 System Documentation

Current state of the codebase:

| Document | What's Inside |
|----------|---------------|
| **[project_architecture.md](system/project_architecture.md)** | Complete technical overview: tech stack, project structure, core concepts (Prompts, Datasets, Models, Runs, Cells), UI layout, state management, TEMPORARY vs PERMANENT breakdown, Phase 2 migration plan, testing strategy, known limitations |

---

## 📋 Tasks Documentation

Feature-specific PRDs and implementation plans:

*No task docs created yet. Phase 1 was implemented directly from specs.md. Use this directory for Phase 2+ feature planning.*

---

*Last updated: 2025-10-26*
