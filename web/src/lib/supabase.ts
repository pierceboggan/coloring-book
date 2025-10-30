import { createBrowserClient } from '@supabase/ssr'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      album_images: {
        Row: {
          id: string
          album_id: string
          image_id: string
          created_at: string
        }
        Insert: {
          id?: string
          album_id: string
          image_id: string
          created_at?: string
        }
        Update: {
          id?: string
          album_id?: string
          image_id?: string
          created_at?: string
        }
      }
      family_albums: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          share_code: string
          created_at: string
          cover_image_id: string | null
          expires_at: string | null
          comments_enabled: boolean
          downloads_enabled: boolean
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          share_code: string
          created_at?: string
          cover_image_id?: string | null
          expires_at?: string | null
          comments_enabled?: boolean
          downloads_enabled?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          share_code?: string
          created_at?: string
          cover_image_id?: string | null
          expires_at?: string | null
          comments_enabled?: boolean
          downloads_enabled?: boolean
        }
      }
      images: {
        Row: {
          id: string
          user_id: string
          original_url: string
          coloring_page_url: string | null
          created_at: string
          updated_at: string
          name: string
          status: 'uploading' | 'processing' | 'completed' | 'error'
          variant_urls: string[] | null
          variant_prompts: string[] | null
          archived_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          original_url: string
          coloring_page_url?: string | null
          created_at?: string
          updated_at?: string
          name: string
          status?: 'uploading' | 'processing' | 'completed' | 'error'
          variant_urls?: string[] | null
          variant_prompts?: string[] | null
          archived_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          original_url?: string
          coloring_page_url?: string | null
          created_at?: string
          updated_at?: string
          name?: string
          status?: 'uploading' | 'processing' | 'completed' | 'error'
          variant_urls?: string[] | null
          variant_prompts?: string[] | null
          archived_at?: string | null
        }
      }
      photobook_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          payload: Json | null
          pdf_path: string | null
          pdf_url: string | null
          processed_count: number | null
          started_at: string | null
          status: 'queued' | 'processing' | 'completed' | 'failed'
          title: string
          total_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          pdf_path?: string | null
          pdf_url?: string | null
          processed_count?: number | null
          started_at?: string | null
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          title: string
          total_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          pdf_path?: string | null
          pdf_url?: string | null
          processed_count?: number | null
          started_at?: string | null
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          title?: string
          total_count?: number | null
          updated_at?: string
          user_id?: string
        }
      }
      photobooks: {
        Row: {
          created_at: string
          id: string
          image_count: number
          pdf_url: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_count: number
          pdf_url: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_count?: number
          pdf_url?: string
          title?: string
          user_id?: string
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
