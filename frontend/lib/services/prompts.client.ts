/**
 * Client-side Prompts Service
 *
 * Provides async functions to interact with the prompts API.
 * Replaces the mock repository functions from mockRepo.temp.ts.
 */

// Import the Prompt type from types.ts to ensure compatibility
import type { Prompt } from '../types'

/**
 * Fetch all prompts
 */
export async function getAllPrompts(): Promise<Prompt[]> {
  const response = await fetch('/api/prompts')

  if (!response.ok) {
    throw new Error('Failed to fetch prompts')
  }

  return response.json()
}

/**
 * Fetch prompts by type
 */
export async function getPromptsByType(type: 'generator' | 'grader'): Promise<Prompt[]> {
  const response = await fetch(`/api/prompts?type=${type}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch ${type} prompts`)
  }

  return response.json()
}

/**
 * Fetch a single prompt by ID
 */
export async function getPromptById(id: string): Promise<Prompt | null> {
  const response = await fetch(`/api/prompts/${id}`)

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error('Failed to fetch prompt')
  }

  return response.json()
}

/**
 * Create a new prompt
 */
export async function createPrompt(
  name: string,
  type: 'generator' | 'grader',
  text: string = ''
): Promise<Prompt> {
  const response = await fetch('/api/prompts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, type, text }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create prompt')
  }

  return response.json()
}

/**
 * Update a prompt
 */
export async function updatePrompt(
  id: string,
  updates: { name?: string; type?: 'generator' | 'grader'; text?: string; expected_output?: 'none' | 'response' | 'json'; version_counter?: number }
): Promise<Prompt> {
  const response = await fetch(`/api/prompts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update prompt')
  }

  return response.json()
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
  const response = await fetch(`/api/prompts/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete prompt')
  }
}
