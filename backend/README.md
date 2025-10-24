## About: backend/

**PLACEHOLDER FOR PHASE 2** - Keep empty during Phase 1.

This directory will contain the backend implementation after UI validation.

### Future Structure (Phase 2+)

**supabase/**
- Database schema migrations
- RLS policies
- Row-level security setup

**api/**
- API routes (or Supabase Edge Functions)
- Provider adapters (OpenAI, Anthropic)
- Unified interface for all LLM calls

**workers/**
- Job queue implementation
- Async execution with retry/backoff
- Realtime event emitters

**utils/**
- Cost calculation (pricing table)
- Token counting
- Caching layer
- Error normalization

### Migration from Phase 1
When moving from Phase 1 → Phase 2:
1. Remove `frontend/lib/mockRepo.temp.ts` → Replace with Supabase client
2. Remove `frontend/lib/mockRunExecutor.temp.ts` → Replace with API calls + queue
3. Add auth layer (Supabase Auth)
4. Add API key management (encrypted storage)
5. Wire realtime subscriptions for cell updates

### Notes
- DO NOT create files here during Phase 1
- This is a hard stop boundary
- Phase 1 = UI validation only
- Phase 2 = Backend implementation
