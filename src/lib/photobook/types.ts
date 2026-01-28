import type { Database, Json } from '@/lib/supabase'

export interface PhotobookImage {
  id: string
  name: string
  coloring_page_url: string
}

export interface PhotobookJobPayload {
  images: PhotobookImage[]
  title: string
  userId: string
}

export type PhotobookJobRow = Database['public']['Tables']['photobook_jobs']['Row']
export type PhotobookJobInsert = Database['public']['Tables']['photobook_jobs']['Insert']
export type PhotobookJobUpdate = Database['public']['Tables']['photobook_jobs']['Update']

export type PhotobookJobStatus = PhotobookJobRow['status']

export function serializePayload(payload: PhotobookJobPayload): Json {
  return payload as unknown as Json
}

export function parsePayload(payload: PhotobookJobRow['payload']): PhotobookJobPayload | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const candidate = payload as Record<string, unknown>
  if (!Array.isArray(candidate.images)) {
    return null
  }

  const images: PhotobookImage[] = candidate.images
    .map((image) => {
      if (!image || typeof image !== 'object') {
        return null
      }

      const record = image as Record<string, unknown>
      const id = typeof record.id === 'string' ? record.id : null
      const name = typeof record.name === 'string' ? record.name : null
      const url = typeof record.coloring_page_url === 'string' ? record.coloring_page_url : null

      if (!id || !name || !url) {
        return null
      }

      return { id, name, coloring_page_url: url }
    })
    .filter((value): value is PhotobookImage => Boolean(value))

  const title = typeof candidate.title === 'string' ? candidate.title : null
  const userId = typeof candidate.userId === 'string' ? candidate.userId : null

  if (!title || !userId) {
    return null
  }

  return { images, title, userId }
}
