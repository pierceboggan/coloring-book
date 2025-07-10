import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
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
        }
      }
    }
  }
}