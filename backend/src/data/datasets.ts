/**
 * Datasets Data Layer
 *
 * This module provides CRUD operations for datasets backed by Supabase.
 * All operations enforce Row Level Security (RLS) - users can only access their own datasets.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../lib/types'

type Dataset = Database['public']['Tables']['datasets']['Row']
type DatasetUpdate = Database['public']['Tables']['datasets']['Update']
type DatasetRow = Database['public']['Tables']['dataset_rows']['Row']
type DatasetRowInsert = Database['public']['Tables']['dataset_rows']['Insert']

/**
 * List all datasets for the authenticated user
 *
 * @param supabase - Authenticated Supabase client
 * @returns Array of datasets, ordered by most recently created
 * @throws Error if user is not authenticated
 */
export async function listDatasets(supabase: SupabaseClient<Database>): Promise<Dataset[]> {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to list datasets: ${error.message}`)
  }

  return data
}

/**
 * Get a single dataset by ID
 *
 * @param supabase - Authenticated Supabase client
 * @param id - The dataset UUID
 * @returns The dataset if found and owned by user
 * @throws Error if dataset not found or user lacks permission
 */
export async function getDataset(supabase: SupabaseClient<Database>, id: string): Promise<Dataset> {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to get dataset: ${error.message}`)
  }

  if (!data) {
    throw new Error('Dataset not found')
  }

  return data
}

/**
 * Get dataset rows with pagination
 *
 * @param supabase - Authenticated Supabase client
 * @param datasetId - The dataset UUID
 * @param limit - Maximum number of rows to return (default: 100)
 * @param offset - Number of rows to skip (default: 0)
 * @returns Array of dataset rows, ordered by row_index
 * @throws Error if query fails or user lacks permission
 */
export async function getDatasetRows(
  supabase: SupabaseClient<Database>,
  datasetId: string,
  limit: number = 100,
  offset: number = 0
): Promise<DatasetRow[]> {
  const { data, error } = await supabase
    .from('dataset_rows')
    .select('*')
    .eq('dataset_id', datasetId)
    .order('row_index', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to get dataset rows: ${error.message}`)
  }

  return data
}

/**
 * Create a new dataset with rows
 *
 * @param supabase - Authenticated Supabase client
 * @param name - Dataset name
 * @param filePath - Optional path in Supabase Storage
 * @param rows - Array of row data (will be inserted as dataset_rows)
 * @returns The created dataset
 * @throws Error if creation fails or user is not authenticated
 */
export async function createDataset(
  supabase: SupabaseClient<Database>,
  name: string,
  filePath: string | null,
  rows: Record<string, any>[]
): Promise<Dataset> {
  // Get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  // Create the dataset first
  const { data: dataset, error: datasetError } = await supabase
    .from('datasets')
    .insert({
      name,
      file_path: filePath,
      row_count: rows.length,
      owner_id: user.id,
    })
    .select()
    .single()

  if (datasetError) {
    throw new Error(`Failed to create dataset: ${datasetError.message}`)
  }

  // Create dataset rows in bulk
  if (rows.length > 0) {
    const datasetRows: DatasetRowInsert[] = rows.map((rowData, index) => ({
      dataset_id: dataset.id,
      row_index: index,
      data: rowData,
    }))

    const { error: rowsError } = await supabase
      .from('dataset_rows')
      .insert(datasetRows)

    if (rowsError) {
      // If rows insertion fails, delete the dataset to maintain consistency
      await supabase.from('datasets').delete().eq('id', dataset.id)
      throw new Error(`Failed to insert dataset rows: ${rowsError.message}`)
    }
  }

  return dataset
}

/**
 * Update an existing dataset
 *
 * @param supabase - Authenticated Supabase client
 * @param id - The dataset UUID
 * @param updates - Partial dataset data to update
 * @returns The updated dataset
 * @throws Error if update fails, dataset not found, or user lacks permission
 */
export async function updateDataset(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Partial<Omit<DatasetUpdate, 'id' | 'owner_id' | 'created_at'>>
): Promise<Dataset> {
  const { data, error } = await supabase
    .from('datasets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update dataset: ${error.message}`)
  }

  if (!data) {
    throw new Error('Dataset not found or permission denied')
  }

  return data
}

/**
 * Delete a dataset (cascade deletes all rows)
 *
 * @param supabase - Authenticated Supabase client
 * @param id - The dataset UUID
 * @throws Error if deletion fails, dataset not found, or user lacks permission
 */
export async function deleteDataset(supabase: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await supabase.from('datasets').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete dataset: ${error.message}`)
  }
}
