import { createBrowserClient } from '@supabase/ssr'

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
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

console.log('🔧 Supabase Client Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey?.substring(0, 20)
})

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)