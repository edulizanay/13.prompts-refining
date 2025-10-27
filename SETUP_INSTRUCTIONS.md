# Setup Instructions - Separated Backend Architecture

## Architecture Overview

The application now uses a **separated backend architecture**:

```
Frontend (Port 3000)          Backend (Port 3001)
├── Next.js UI               ├── Express Server
├── React Components         ├── API Routes
├── Supabase Browser Client  ├── Supabase Server Client
└── Calls Backend API        └── Database Operations
```

## Completed Implementation ✅

### Backend Server (`backend/`)
- Express.js server on port 3001
- JWT authentication middleware
- Supabase integration without Next.js dependencies
- API routes: `/api/prompts`, `/api/datasets`
- File upload handling with Multer

### Frontend (`frontend/`)
- Next.js app on port 3000
- API client with automatic auth token injection
- Supabase browser client for authentication
- Service layer calls backend API

### Database
- Supabase PostgreSQL with RLS policies
- Tables: `prompts`, `datasets`, `dataset_rows`
- Row Level Security ensures users only access their own data

---

## Setup Instructions

### 1. Install Dependencies

```bash
# From project root
npm run install-all

# This will install:
# - Root workspace dependencies
# - Frontend dependencies
# - Backend dependencies
```

### 2. Apply Database Migrations

**Go to Supabase Dashboard:** https://supabase.com/dashboard/project/wcmiprucvjrjhfnrtfas

Navigate to **SQL Editor** → **New Query** and run each migration:

1. **Migration #1** - Prompts table
   ```sql
   -- Copy and paste: supabase/migrations/20251026000001_create_prompts_table.sql
   ```

2. **Migration #2** - Prompts fields
   ```sql
   -- Copy and paste: supabase/migrations/20251026000002_add_prompt_fields.sql
   ```

3. **Migration #3** - Datasets tables
   ```sql
   -- Copy and paste: supabase/migrations/20251026000003_create_datasets_tables.sql
   ```

**Verify:** Tables `prompts`, `datasets`, and `dataset_rows` appear in **Table Editor**.

### 3. Configure Environment Variables

**Backend** (`backend/.env`) - Already configured ✅
```bash
PORT=3001
SUPABASE_URL=https://wcmiprucvjrjhfnrtfas.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=gsk_...
CEREBRAS_API_KEY=csk-...
```

**Frontend** (`frontend/.env.local`) - Already configured ✅
```bash
NEXT_PUBLIC_SUPABASE_URL=https://wcmiprucvjrjhfnrtfas.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Enable Email Auth in Supabase

1. Go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. For development, disable email confirmation:
   - **Authentication** → **Settings**
   - Scroll to **Email Auth**
   - Uncheck "Enable email confirmations"

### 5. Create a Test User

**Option A: Via Supabase Dashboard**
1. **Authentication** → **Users**
2. Click "Add User" → "Create new user"
3. Enter:
   - Email: `test@example.com`
   - Password: `test123`
   - Auto-confirm user: ✅ Yes

**Option B: Via the App**
1. Start the servers: `npm run dev`
2. Navigate to http://localhost:3000/auth
3. Click "Sign up" and create an account

---

## Running the Application

### Development Mode (Both Servers)

```bash
# From project root - runs both servers concurrently
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000 (Next.js)
- **Backend**: http://localhost:3001 (Express)

### Run Servers Individually

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

### Production Build

```bash
# Build both
npm run build

# Start production servers
npm run start
```

---

## Project Structure

```
project-root/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── server.ts          # Express app entry point
│   │   ├── routes/            # API route handlers
│   │   │   ├── prompts.ts
│   │   │   └── datasets.ts
│   │   ├── data/              # Database operations
│   │   │   ├── prompts.ts
│   │   │   └── datasets.ts
│   │   └── lib/               # Utilities
│   │       ├── supabase.ts    # Supabase client
│   │       ├── auth.ts        # JWT middleware
│   │       └── types.ts       # Database types
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                   # Server-side secrets
│
├── frontend/                   # Next.js UI
│   ├── app/
│   │   ├── page.tsx           # Main app page
│   │   └── auth/page.tsx      # Sign in/sign up
│   ├── components/            # React components
│   ├── lib/
│   │   ├── services/          # API client layer
│   │   │   ├── api-client.ts  # Auth helper
│   │   │   ├── prompts.client.ts
│   │   │   └── datasets.client.ts
│   │   └── supabase/
│   │       ├── client.ts      # Browser Supabase client
│   │       └── types.ts       # Database types
│   ├── package.json
│   └── .env.local             # Browser-safe vars
│
├── supabase/                   # Database migrations
│   └── migrations/
│       ├── 20251026000001_create_prompts_table.sql
│       ├── 20251026000002_add_prompt_fields.sql
│       └── 20251026000003_create_datasets_tables.sql
│
└── package.json                # Root workspace config
```

---

## How Authentication Works

1. **User signs in** via frontend (`/auth` page)
2. **Supabase returns JWT** access token
3. **Frontend stores token** in browser session
4. **All API calls** include `Authorization: Bearer <token>` header
5. **Backend verifies token** via auth middleware
6. **Supabase RLS** enforces user data isolation

---

## API Endpoints

### Prompts
- `GET /api/prompts` - List all prompts
- `GET /api/prompts?type=generator` - Filter by type
- `POST /api/prompts` - Create prompt
- `GET /api/prompts/:id` - Get single prompt
- `PATCH /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt

### Datasets
- `GET /api/datasets` - List all datasets
- `POST /api/datasets` - Upload CSV/JSON file
- `GET /api/datasets/:id?limit=100&offset=0` - Get dataset with rows
- `DELETE /api/datasets/:id` - Delete dataset

All endpoints require authentication via `Authorization: Bearer <token>` header.

---

## Testing Checklist

After setup, verify:

- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:3001/health (should return `{"status":"ok"}`)
- [ ] Can sign in at http://localhost:3000/auth
- [ ] Can create a new prompt
- [ ] Can edit prompt text
- [ ] Prompt persists after page reload
- [ ] Can upload a dataset (CSV or JSON)
- [ ] Can view dataset preview

---

## Troubleshooting

### "Module not found" errors

- Make sure you've run `npm run install-all`
- Try deleting `node_modules` and reinstalling

### Backend won't start

- Check `backend/.env` exists with correct values
- Verify port 3001 is not in use: `lsof -i :3001`
- Check backend logs for errors

### Frontend can't connect to backend

- Verify backend is running on port 3001
- Check `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3001`
- Check browser console for CORS errors

### Authentication errors

- Verify you've created a test user in Supabase
- Check that JWT token is being sent (see Network tab, Authorization header)
- Verify Supabase anon key is correct in both `backend/.env` and `frontend/.env.local`

### Database errors

- Verify all migrations were applied in Supabase Dashboard
- Check RLS policies are in place (SQL Editor → each table should have policies)
- Verify user's `id` exists in `auth.users` table

---

## What Changed from Previous Setup

### Before (Monolithic Next.js)
- API routes in `frontend/app/api/`
- Middleware for authentication
- Server-side data layer in `frontend/lib/data/`
- Single port (3000)

### After (Separated Backend)
- API routes in `backend/src/routes/`
- JWT middleware in Express
- Data layer in `backend/src/data/`
- Two ports: 3000 (UI) + 3001 (API)
- Frontend calls backend via HTTP with Authorization header

### Benefits
- ✅ True separation of concerns
- ✅ API keys never exposed to browser
- ✅ Can scale frontend and backend independently
- ✅ Clearer project structure
- ✅ Backend can be reused by other clients (mobile app, CLI, etc.)

---

## Next Steps

With Slice 1 (Prompts) and Slice 2 (Datasets) complete, you can:

1. **Test the UI** - Create prompts, upload datasets
2. **Continue with Slice 3** - Runs and execution
3. **Add more features** - Follow `prompt_plan.md`

---

**Last Updated:** 2025-10-27
**Status:** Backend separation complete, all builds passing ✅
