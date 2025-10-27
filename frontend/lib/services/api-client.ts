/**
 * API Client Helper
 *
 * Provides utilities for making authenticated requests to the backend API.
 */

import { getSupabaseBrowserClient } from '../supabase/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Get the current user's access token for API requests
 */
async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * Make an authenticated API request
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  // Add Authorization header if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Add Content-Type for JSON requests
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json'
  }

  const url = `${API_BASE_URL}${endpoint}`

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Make an authenticated API request and parse JSON response
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(endpoint, options)

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status}`
    try {
      const error = await response.json()
      errorMessage = error.error || errorMessage
    } catch {
      // If we can't parse the error, use the default message
    }
    throw new Error(errorMessage)
  }

  return response.json()
}
