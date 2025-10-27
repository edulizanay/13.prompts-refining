/**
 * Supabase Client for Backend
 *
 * Simple server-side Supabase client without Next.js dependencies.
 * Uses environment variables for configuration.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

let supabaseInstance: SupabaseClient<Database> | null = null

/**
 * Get or create a Supabase client instance
 * Uses the anon key by default (respects RLS policies)
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment')
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

/**
 * Get a Supabase client with service role key (bypasses RLS)
 * Use with caution - only for admin operations
 */
export function getSupabaseServiceClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}

/**
 * Get a Supabase client authenticated with a user's access token
 * This respects RLS policies for that specific user
 */
export function getSupabaseClientWithAuth(accessToken: string): SupabaseClient<Database> {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment')
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  })

  return client
}
