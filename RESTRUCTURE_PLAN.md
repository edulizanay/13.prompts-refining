# Backend Separation Restructure Plan

## Goal
Separate frontend and backend into distinct services with proper boundaries.

## Target Architecture

```
frontend/                         ← Pure Next.js client app
  app/
    page.tsx                      ← Frontend pages
    auth/page.tsx                 ← Auth UI (keep)
  components/                     ← UI components
  lib/
    services/                     ← API client calls (UPDATE: call localhost:3001)
    supabase/
      client.ts                   ← Browser client (keep)
      types.ts                    ← Shared types (keep)
  .env.local                      ← ONLY NEXT_PUBLIC_ vars

backend/                          ← Node.js Express/Fastify server
  src/
    server.ts                     ← Express app entry point
    routes/
      prompts.ts                  ← Prompt CRUD routes
      datasets.ts                 ← Dataset CRUD routes
    data/
      prompts.ts                  ← Prompt data layer
      datasets.ts                 ← Dataset data layer
    lib/
      supabase.ts                 ← Server Supabase client
      types.ts                    ← Database types
      auth.ts                     ← Auth middleware
  package.json                    ← Backend dependencies
  tsconfig.json                   ← Backend TS config
  .env                            ← Server-side API keys

supabase/                         ← Database migrations (keep as-is)

package.json (root)               ← Workspace orchestration
```

## Detailed Migration Steps

### Phase 1: Backend Infrastructure Setup

**1.1 Create backend package.json**
```json
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.76.1",
    "dotenv": "^17.2.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.6",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

**1.2 Create backend tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**1.3 Create backend/src/server.ts**
```typescript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import promptsRouter from './routes/prompts'
import datasetsRouter from './routes/datasets'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true
}))
app.use(express.json())

// Routes
app.use('/api/prompts', promptsRouter)
app.use('/api/datasets', datasetsRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
})
```

**1.4 Create backend/.env**
```bash
# Server-side only (NEVER expose to browser)
SUPABASE_URL=https://wcmiprucvjrjhfnrtfas.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=gsk_...
CEREBRAS_API_KEY=csk-...
PORT=3001
```

### Phase 2: Move Backend Code

**2.1 Files to Move**
```
FROM: frontend/lib/data/prompts.ts
TO:   backend/src/data/prompts.ts
CHANGES:
  - Import from '../lib/supabase' instead of '../supabase/server'
  - Remove Next.js specific imports

FROM: frontend/lib/data/datasets.ts
TO:   backend/src/data/datasets.ts
CHANGES: Same as above

FROM: frontend/lib/supabase/server.ts
TO:   backend/src/lib/supabase.ts
CHANGES:
  - Remove Next.js cookies() import
  - Use simple createClient() with env vars
  - No cookie handling needed

FROM: frontend/lib/supabase/types.ts
TO:   backend/src/lib/types.ts
CHANGES: None (copy as-is)
```

**2.2 Convert API Routes**
```
FROM: frontend/app/api/prompts/route.ts
TO:   backend/src/routes/prompts.ts
FORMAT: Convert from Next.js Route Handlers to Express routes

Example conversion:
// Before (Next.js)
export async function GET(request: NextRequest) {
  const prompts = await listPrompts()
  return NextResponse.json(prompts)
}

// After (Express)
router.get('/', async (req, res) => {
  try {
    const prompts = await listPrompts()
    res.json(prompts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

**2.3 Auth Middleware**
Create `backend/src/lib/auth.ts`:
```typescript
import { Request, Response, NextFunction } from 'express'
import { getSupabaseClient } from './supabase'

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = getSupabaseClient()

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  req.user = user
  next()
}
```

### Phase 3: Update Frontend

**3.1 Update frontend/lib/services/prompts.client.ts**
```typescript
// Change from:
const response = await fetch('/api/prompts')

// To:
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const response = await fetch(`${API_BASE}/api/prompts`, {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`
  }
})
```

**3.2 Update frontend/lib/services/datasets.client.ts**
Same pattern as above.

**3.3 Remove frontend/middleware.ts**
Auth will be handled by backend middleware instead.

**3.4 Delete frontend/app/api/ directory**
All API routes moved to backend.

**3.5 Delete frontend/lib/data/ directory**
All data layer moved to backend.

**3.6 Update frontend/.env.local**
```bash
# Client-side only (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://wcmiprucvjrjhfnrtfas.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Phase 4: Update Root Configuration

**4.1 Update root package.json**
```json
{
  "name": "prompt-refinement-ui",
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "install-all": "npm install && cd frontend && npm install && cd ../backend && npm install"
  },
  "workspaces": [
    "frontend",
    "backend"
  ],
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

**4.2 Delete root .env.local**
No longer needed, vars split between frontend and backend.

### Phase 5: Testing & Verification

**5.1 Backend compilation test**
```bash
cd backend
npm install
npm run build
# Should compile with no errors
```

**5.2 Frontend compilation test**
```bash
cd frontend
npm run build
# Should compile with no errors
```

**5.3 Integration test**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Browser: http://localhost:3000
# Should be able to sign in and create prompts/datasets
```

## Rollback Plan

If things break:
1. All changes are in git
2. Can revert with: `git checkout HEAD -- frontend/ backend/`
3. Or work from a feature branch

## Migration Order (Safest)

1. ✅ Create backend infrastructure (doesn't break anything)
2. ✅ Move and convert API routes (frontend still works with old routes)
3. ✅ Test backend independently with curl/Postman
4. ✅ Update frontend to call backend API
5. ✅ Remove old frontend API routes
6. ✅ Test end-to-end
7. ✅ Commit when everything works

## Files to Create/Modify Summary

### Create:
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/.env`
- `backend/src/server.ts`
- `backend/src/routes/prompts.ts`
- `backend/src/routes/datasets.ts`
- `backend/src/data/prompts.ts`
- `backend/src/data/datasets.ts`
- `backend/src/lib/supabase.ts`
- `backend/src/lib/types.ts`
- `backend/src/lib/auth.ts`

### Modify:
- `frontend/lib/services/prompts.client.ts`
- `frontend/lib/services/datasets.client.ts`
- `frontend/.env.local`
- Root `package.json`

### Delete:
- `frontend/app/api/` (entire directory)
- `frontend/lib/data/` (entire directory)
- `frontend/lib/supabase/server.ts`
- `frontend/middleware.ts`
- Root `.env.local`

## Estimated Time
- Phase 1: 15 minutes (setup)
- Phase 2: 30 minutes (move code)
- Phase 3: 20 minutes (update frontend)
- Phase 4: 10 minutes (scripts)
- Phase 5: 15 minutes (testing)
**Total: ~90 minutes**

## Risk Assessment
- **Low Risk**: Backend setup (doesn't affect existing code)
- **Medium Risk**: API route conversion (format changes)
- **High Risk**: Auth flow changes (session management)

## Success Criteria
- [ ] Backend compiles without errors
- [ ] Frontend compiles without errors
- [ ] Can sign in from frontend
- [ ] Can create/view prompts
- [ ] Can upload/view datasets
- [ ] No console errors
- [ ] All tests pass
