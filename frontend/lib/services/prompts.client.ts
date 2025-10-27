/**
 * Client-side Prompts Service
 *
 * Provides async functions to interact with the prompts API.
 * Calls the backend Express server on port 3001.
 */

import type { Prompt } from '../types'
import { apiRequest } from './api-client'

/**
 * Fetch all prompts
 */
export async function getAllPrompts(): Promise<Prompt[]> {
  return apiRequest<Prompt[]>('/api/prompts')
}

/**
 * Fetch prompts by type
 */
export async function getPromptsByType(type: 'generator' | 'grader'): Promise<Prompt[]> {
  return apiRequest<Prompt[]>(`/api/prompts?type=${type}`)
}

/**
 * Fetch a single prompt by ID
 */
export async function getPromptById(id: string): Promise<Prompt | null> {
  try {
    return await apiRequest<Prompt>(`/api/prompts/${id}`)
  } catch (error) {
    // Return null for 404 errors
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}

/**
 * Create a new prompt
 */
export async function createPrompt(
  name: string,
  type: 'generator' | 'grader',
  text: string = ''
): Promise<Prompt> {
  return apiRequest<Prompt>('/api/prompts', {
    method: 'POST',
    body: JSON.stringify({ name, type, text }),
  })
}

/**
 * Update a prompt
 */
export async function updatePrompt(
  id: string,
  updates: {
    name?: string
    type?: 'generator' | 'grader'
    text?: string
    expected_output?: 'none' | 'response' | 'json'
    version_counter?: number
  }
): Promise<Prompt> {
  return apiRequest<Prompt>(`/api/prompts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

/**
 * Rename a prompt (special case of update)
 */
export async function renamePrompt(id: string, newName: string): Promise<Prompt> {
  return updatePrompt(id, { name: newName })
}

/**
 * Delete a prompt
 */
export async function deletePrompt(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/api/prompts/${id}`, {
    method: 'DELETE',
  })
}
