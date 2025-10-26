# Supabase Setup Instructions

## Manual Migration Steps

Since the Supabase CLI cannot run in the cloud environment, please apply migrations manually:

### Step 1: Apply the Prompts Table Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/wcmiprucvjrjhfnrtfas
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20251026000001_create_prompts_table.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify success: You should see "Success. No rows returned"

### Step 2: Verify the Migration

1. Go to **Table Editor** in the left sidebar
2. You should see a new table called `prompts`
3. Click on the table to verify columns:
   - `id` (uuid, primary key)
   - `name` (text)
   - `type` (text)
   - `body` (text)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)
   - `owner_id` (uuid, foreign key to auth.users)

### Step 3: Verify RLS Policies

1. Go to **Database** → **Policies** in the left sidebar
2. You should see 4 policies for the `prompts` table:
   - ✅ Users can view their own prompts (SELECT)
   - ✅ Users can insert their own prompts (INSERT)
   - ✅ Users can update their own prompts (UPDATE)
   - ✅ Users can delete their own prompts (DELETE)

## Troubleshooting

### Error: relation "auth.users" does not exist
- This means Supabase Auth is not enabled
- Go to **Authentication** → **Settings** and ensure Auth is enabled

### Error: Policy already exists
- This means the migration was already applied
- You can safely ignore this error

### Error: Permission denied
- Make sure you're logged into the correct Supabase project
- Verify you have admin access to the project

## Next Steps

Once the migration is applied, the backend code will be able to:
- Create, read, update, and delete prompts
- Enforce row-level security (users can only access their own data)
- Automatically track created_at and updated_at timestamps
