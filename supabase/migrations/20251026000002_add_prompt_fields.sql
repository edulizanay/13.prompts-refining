-- Add fields to match existing UI expectations
-- This migration adds expected_output and version_counter to prompts table

ALTER TABLE public.prompts
  ADD COLUMN expected_output TEXT NOT NULL DEFAULT 'none' CHECK (expected_output IN ('none', 'response', 'json')),
  ADD COLUMN version_counter INTEGER NOT NULL DEFAULT 1;

-- Rename body column to text to match existing UI
ALTER TABLE public.prompts
  RENAME COLUMN body TO text;

-- Update existing rows (if any)
UPDATE public.prompts
SET expected_output = 'none', version_counter = 1
WHERE expected_output IS NULL OR version_counter IS NULL;
