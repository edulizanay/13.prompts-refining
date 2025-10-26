/**
 * Supabase Database Types
 *
 * This file defines the TypeScript types for the Supabase database schema.
 * These types ensure type safety when querying the database.
 *
 * TODO: Generate these automatically using `supabase gen types typescript`
 * For now, we'll manually define the schema based on our migrations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      prompts: {
        Row: {
          id: string
          name: string
          type: 'generator' | 'grader'
          body: string
          created_at: string
          updated_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          type: 'generator' | 'grader'
          body?: string
          created_at?: string
          updated_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'generator' | 'grader'
          body?: string
          created_at?: string
          updated_at?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'prompts_owner_id_fkey'
            columns: ['owner_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
