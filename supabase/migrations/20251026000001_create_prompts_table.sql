-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('generator', 'grader')),
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on owner_id for faster queries
CREATE INDEX IF NOT EXISTS prompts_owner_id_idx ON public.prompts(owner_id);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS prompts_type_idx ON public.prompts(type);

-- Enable Row Level Security
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own prompts
CREATE POLICY "Users can view their own prompts"
  ON public.prompts
  FOR SELECT
  USING (auth.uid() = owner_id);

-- RLS Policy: Users can insert their own prompts
CREATE POLICY "Users can insert their own prompts"
  ON public.prompts
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- RLS Policy: Users can update their own prompts
CREATE POLICY "Users can update their own prompts"
  ON public.prompts
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- RLS Policy: Users can delete their own prompts
CREATE POLICY "Users can delete their own prompts"
  ON public.prompts
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER set_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
