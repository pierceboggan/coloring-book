export interface UserImage {
  id: string
  name: string
  original_url: string
  coloring_page_url?: string
  status: 'processing' | 'completed' | 'error'
  created_at: string
  variant_urls?: string[] | null
  variant_prompts?: string[] | null
  archived_at?: string | null
  is_favorite?: boolean | null
}

export type VariantSummary = {
  url: string
  prompt: string
}

export interface ColoringDisplayItem {
  id: string
  displayId: string
  name: string
  coloringPageUrl: string
  createdAt: string
  isVariant: boolean
  variantPrompt?: string
  parentImage: UserImage
  isFavorite: boolean
}

export type CollabSession = {
  sessionId: string
  userId: string
} | null
