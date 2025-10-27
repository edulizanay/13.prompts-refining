-- Create datasets table
CREATE TABLE IF NOT EXISTS public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT, -- Path in Supabase Storage (optional for manual datasets)
  row_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create dataset_rows table
CREATE TABLE IF NOT EXISTS public.dataset_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  data JSONB NOT NULL, -- Store row data as JSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS datasets_owner_id_idx ON public.datasets(owner_id);
CREATE INDEX IF NOT EXISTS dataset_rows_dataset_id_idx ON public.dataset_rows(dataset_id);
CREATE INDEX IF NOT EXISTS dataset_rows_dataset_id_row_index_idx ON public.dataset_rows(dataset_id, row_index);

-- Enable Row Level Security
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for datasets
CREATE POLICY "Users can view their own datasets"
  ON public.datasets
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own datasets"
  ON public.datasets
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own datasets"
  ON public.datasets
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own datasets"
  ON public.datasets
  FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for dataset_rows
-- Users can only access rows from datasets they own
CREATE POLICY "Users can view rows from their datasets"
  ON public.dataset_rows
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.datasets
      WHERE datasets.id = dataset_rows.dataset_id
      AND datasets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rows to their datasets"
  ON public.dataset_rows
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.datasets
      WHERE datasets.id = dataset_rows.dataset_id
      AND datasets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rows in their datasets"
  ON public.dataset_rows
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.datasets
      WHERE datasets.id = dataset_rows.dataset_id
      AND datasets.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.datasets
      WHERE datasets.id = dataset_rows.dataset_id
      AND datasets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rows from their datasets"
  ON public.dataset_rows
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.datasets
      WHERE datasets.id = dataset_rows.dataset_id
      AND datasets.owner_id = auth.uid()
    )
  );
