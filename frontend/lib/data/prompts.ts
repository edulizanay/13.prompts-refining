/**
 * Prompts Data Layer
 *
 * This module provides CRUD operations for prompts backed by Supabase.
 * All operations enforce Row Level Security (RLS) - users can only access their own prompts.
 */

import { getSupabaseServerClient } from '../supabase/server'
import type { Database } from '../supabase/types'

type Prompt = Database['public']['Tables']['prompts']['Row']
type PromptInsert = Database['public']['Tables']['prompts']['Insert']
type PromptUpdate = Database['public']['Tables']['prompts']['Update']

/**
 * List all prompts for the authenticated user
 *
 * @returns Array of prompts, ordered by most recently updated
 * @throws Error if user is not authenticated
 */
export async function listPrompts(): Promise<Prompt[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to list prompts: ${error.message}`)
  }

  return data
}

/**
 * Get a single prompt by ID
 *
 * @param id - The prompt UUID
 * @returns The prompt if found and owned by user
 * @throws Error if prompt not found or user lacks permission
 */
export async function getPrompt(id: string): Promise<Prompt> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to get prompt: ${error.message}`)
  }

  if (!data) {
    throw new Error('Prompt not found')
  }

  return data
}

/**
 * Create a new prompt
 *
 * @param prompt - Prompt data (owner_id will be set automatically from auth)
 * @returns The created prompt
 * @throws Error if creation fails or user is not authenticated
 */
export async function createPrompt(
  prompt: Omit<PromptInsert, 'owner_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<Prompt> {
  const supabase = await getSupabaseServerClient()

  // Get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('prompts')
    .insert({
      ...prompt,
      owner_id: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create prompt: ${error.message}`)
  }

  return data
}

/**
 * Update an existing prompt
 *
 * @param id - The prompt UUID
 * @param updates - Partial prompt data to update
 * @returns The updated prompt
 * @throws Error if update fails, prompt not found, or user lacks permission
 */
export async function updatePrompt(
  id: string,
  updates: Partial<Omit<PromptUpdate, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>
): Promise<Prompt> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update prompt: ${error.message}`)
  }

  if (!data) {
    throw new Error('Prompt not found or permission denied')
  }

  return data
}

/**
 * Delete a prompt
 *
 * @param id - The prompt UUID
 * @throws Error if deletion fails, prompt not found, or user lacks permission
 */
export async function deletePrompt(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.from('prompts').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete prompt: ${error.message}`)
  }
}

/**
 * List prompts by type
 *
 * @param type - Filter by prompt type ('generator' or 'grader')
 * @returns Array of prompts of the specified type
 */
export async function listPromptsByType(
  type: 'generator' | 'grader'
): Promise<Prompt[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('type', type)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to list prompts by type: ${error.message}`)
  }

  return data
}
