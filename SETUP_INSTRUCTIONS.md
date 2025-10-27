# Setup Instructions for Supabase Integration

## Progress Summary

### ✅ Completed (Slice 1.1-1.2 + Slice 1.3 infrastructure)

1. **Environment Setup**
   - Created `.env.local` with your Supabase API keys
   - Created `.env.example` template for the repository

2. **Database Schema**
   - Created `prompts` table migration with RLS policies
   - Added `expected_output` and `version_counter` fields to match UI expectations
   - Created `datasets` and `dataset_rows` tables with RLS policies
   - Files: `supabase/migrations/20251026000001_create_prompts_table.sql`
   - Files: `supabase/migrations/20251026000002_add_prompt_fields.sql`
   - Files: `supabase/migrations/20251026000003_create_datasets_tables.sql`

3. **Supabase Client Setup**
   - Created browser client (`frontend/lib/supabase/client.ts`)
   - Created server client (`frontend/lib/supabase/server.ts`)
   - Created TypeScript types (`frontend/lib/supabase/types.ts`)

4. **Backend Data Layer**
   - Created prompts data layer (`frontend/lib/data/prompts.ts`)
   - Implemented CRUD operations with RLS enforcement
   - Set up integration test infrastructure

5. **API Routes**
   - Created `GET /api/prompts` - List all prompts
   - Created `POST /api/prompts` - Create new prompt
   - Created `GET /api/prompts/[id]` - Get single prompt
   - Created `PATCH /api/prompts/[id]` - Update prompt
   - Created `DELETE /api/prompts/[id]` - Delete prompt

6. **Authentication**
   - Added Supabase Auth helpers (`frontend/lib/auth/auth.ts`)
   - Created auth page (`frontend/app/auth/page.tsx`)
   - Added auth middleware to protect routes (`frontend/middleware.ts`)

7. **Client Service Layer**
   - Created async service functions (`frontend/lib/services/prompts.client.ts`)
   - Provides drop-in replacements for mock functions

---

## 🚧 Manual Steps Required

Before the app will work, you must complete these manual steps:

### Step 1: Apply Database Migrations

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/wcmiprucvjrjhfnrtfas
2. Navigate to **SQL Editor** → **New Query**
3. Apply migration #1 (Prompts table):
   - Copy contents of `supabase/migrations/20251026000001_create_prompts_table.sql`
   - Paste and run
4. Apply migration #2 (Prompts fields):
   - Copy contents of `supabase/migrations/20251026000002_add_prompt_fields.sql`
   - Paste and run
5. Apply migration #3 (Datasets tables):
   - Copy contents of `supabase/migrations/20251026000003_create_datasets_tables.sql`
   - Paste and run

Expected result: `prompts`, `datasets`, and `dataset_rows` tables should appear in **Table Editor** with all fields.

### Step 2: Enable Email Auth (if not already enabled)

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Ensure **Email** provider is enabled
3. For development, you can disable email confirmation:
   - Go to **Authentication** → **Settings**
   - Scroll to **Email Auth**
   - Uncheck "Enable email confirmations" (dev only!)

### Step 3: Create a Test User

Option A: Via Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click "Add User" → "Create new user"
3. Enter:
   - Email: `test@example.com`
   - Password: `test123` (or your choice)
   - Auto-confirm user: ✅ Yes

Option B: Via the App
1. Run `npm run dev` in the `frontend` directory
2. Navigate to `/auth`
3. Click "Sign up"
4. Enter email and password
5. (If email confirmation is enabled, check your email)

### Step 4: Seed Initial Prompts (Optional but Recommended)

After signing in, seed some test prompts:

**Option A: Via Browser Console**
1. Sign in to the app
2. Open browser console (F12)
3. Copy and paste the contents of `scripts/seed-prompts-browser.js`
4. Press Enter
5. Page will auto-reload with 3 test prompts

**Option B: Create Manually**
1. Click the menu icon (three dots) next to the prompt name
2. Click "New Prompt"
3. Enter a name and select type (Generator or Grader)
4. Start typing your prompt in the editor

---

## 🔄 Remaining Work (Slice 1.3)

The following tasks still need to be completed:

### 1. Update UI Components to Use Async Service Functions

The UI components currently use synchronous mock functions. They need to be updated to use the new async service layer:

**Files to update:**
- `frontend/components/EditorPanel.tsx`
  - Replace `getAllPrompts()` → `await getAllPrompts()`
  - Replace `getPromptById()` → `await getPromptById()`
  - Replace `createPrompt()` → `await createPrompt()`
  - Replace `updatePrompt()` → `await updatePrompt()`
  - Replace `renamePrompt()` → `await renamePrompt()`

- `frontend/app/page.tsx`
  - Replace `getAllPrompts()` → `await getAllPrompts()`
  - Update imports to use `prompts.client.ts`

### 2. Delete Mock Prompt Code

Once the UI is updated and tested:
- Remove prompt-related functions from `frontend/lib/mockRepo.temp.ts`:
  - `getAllPrompts()`
  - `getPromptById()`
  - `createPrompt()`
  - `updatePrompt()`
  - `renamePrompt()`
  - `deletePrompt()`

### 3. Add Playwright E2E Test

Create an E2E test that verifies:
1. Create a new prompt
2. Edit the prompt text
3. Reload the page
4. Verify the prompt persists

### 4. Testing Checklist

- [x] Migrations applied successfully in Supabase ✅
- [x] Test user created ✅
- [x] Build passes ✅
- [ ] Can sign in at `/auth`
- [ ] Redirects to `/` after sign in
- [ ] Can create a new prompt
- [ ] Can edit prompt text
- [ ] Can rename a prompt
- [ ] Can switch between prompts
- [ ] Prompts persist after page reload
- [ ] RLS works (user can only see their own prompts)

---

## 📁 New Files Created

### Infrastructure
```
.env.local                                    # Your API keys (gitignored)
.env.example                                  # Template for API keys
supabase/
  ├── config.toml                             # Supabase config
  ├── README.md                               # Migration instructions
  └── migrations/
      ├── 20251026000001_create_prompts_table.sql
      ├── 20251026000002_add_prompt_fields.sql
      └── 20251026000003_create_datasets_tables.sql
```

### Backend
```
frontend/
  ├── middleware.ts                           # Auth middleware
  ├── app/
  │   ├── auth/page.tsx                       # Sign in/sign up page
  │   └── api/
  │       └── prompts/
  │           ├── route.ts                    # GET, POST /api/prompts
  │           └── [id]/route.ts               # GET, PATCH, DELETE /api/prompts/[id]
  ├── lib/
  │   ├── auth/
  │   │   └── auth.ts                         # Auth helpers
  │   ├── data/
  │   │   └── prompts.ts                      # Server-side data layer
  │   ├── services/
  │   │   └── prompts.client.ts               # Client-side service layer
  │   └── supabase/
  │       ├── client.ts                       # Browser Supabase client
  │       ├── server.ts                       # Server Supabase client
  │       └── types.ts                        # Database types
  └── jest.integration.config.js              # Integration test config
```

---

## 🐛 Troubleshooting

### "User not authenticated" errors
- Make sure you're signed in (`/auth`)
- Check that auth middleware is working
- Verify cookies are being set

### "Failed to fetch prompts"
- Check that migrations were applied
- Verify RLS policies are in place
- Check browser console for errors

### "relation 'prompts' does not exist"
- Migrations were not applied
- Follow Step 1 in Manual Steps above

### TypeScript errors in IDE
- Run `npm install` in the frontend directory
- Restart TypeScript server in VS Code

---

## 📚 Documentation References

- Supabase Setup: `supabase/README.md`
- Project Architecture: `.agent/system/project_architecture.md`
- Implementation Plan: `prompt_plan.md`
- Todo List: `todo.md`

---

**Last Updated**: 2025-10-26
**Status**: Infrastructure complete, UI integration in progress
**Next Action**: Apply manual steps, then update UI components
