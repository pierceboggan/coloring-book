import { createBrowserClient } from '@supabase/ssr'

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