import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

const fromMock = vi.fn()
const rpcMock = vi.fn()

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

import { POST } from '@/app/api/family-albums/route'

type SupabaseError = { message: string }
type ImageRow = { id: string }
type AlbumRow = {
  id: string
  title: string
  description: string
  share_code: string
  cover_image_id: string | null
  expires_at: string | null
  comments_enabled: boolean
  downloads_enabled: boolean
}

function createRequest(body: Record<string, unknown>): NextRequest {
  return new Request('http://localhost/api/family-albums', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as NextRequest
}

function mockImageValidation(data: ImageRow[], error: SupabaseError | null = null) {
  const inMock = vi.fn().mockResolvedValue({ data, error })
  const eqMock = vi.fn().mockReturnValue({ in: inMock })
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
  fromMock.mockReturnValue({ select: selectMock })

  return { selectMock, eqMock, inMock }
}

function mockAlbumRpc(data: AlbumRow | null, error: SupabaseError | null = null) {
  const singleMock = vi.fn().mockResolvedValue({ data, error })
  rpcMock.mockReturnValue({ single: singleMock })

  return { singleMock }
}

describe('POST /api/family-albums', () => {
  beforeEach(() => {
    fromMock.mockReset()
    rpcMock.mockReset()
  })

  it('validates image IDs before creating an album', async () => {
    const validation = mockImageValidation([{ id: 'image-1' }])

    const response = await POST(createRequest({
      title: 'Family Album',
      userId: 'user-1',
      imageIds: ['image-1', 'missing-image'],
    }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'One or more image IDs are invalid' })
    expect(fromMock).toHaveBeenCalledWith('images')
    expect(validation.eqMock).toHaveBeenCalledWith('user_id', 'user-1')
    expect(validation.inMock).toHaveBeenCalledWith('id', ['image-1', 'missing-image'])
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('creates the album and image links with one atomic RPC', async () => {
    mockImageValidation([{ id: 'image-1' }, { id: 'image-2' }])
    mockAlbumRpc({
      id: 'album-1',
      title: 'Family Album',
      description: '',
      share_code: 'share-code',
      cover_image_id: 'image-1',
      expires_at: null,
      comments_enabled: true,
      downloads_enabled: false,
    })

    const response = await POST(createRequest({
      title: 'Family Album',
      userId: 'user-1',
      imageIds: ['image-1', 'image-2', 'image-2'],
      coverImageId: 'image-1',
      downloadsEnabled: false,
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.album).toEqual(expect.objectContaining({
      id: 'album-1',
      shareCode: 'share-code',
      coverImageId: 'image-1',
      downloadsEnabled: false,
    }))
    expect(rpcMock).toHaveBeenCalledWith('create_family_album_with_images', expect.objectContaining({
      p_title: 'Family Album',
      p_user_id: 'user-1',
      p_cover_image_id: 'image-1',
      p_downloads_enabled: false,
      p_image_ids: ['image-1', 'image-2'],
    }))
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('does not insert a standalone album when the atomic image linking fails', async () => {
    mockImageValidation([{ id: 'image-1' }])
    mockAlbumRpc(null, { message: 'album_images insert failed' })

    const response = await POST(createRequest({
      title: 'Family Album',
      userId: 'user-1',
      imageIds: ['image-1'],
    }))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      error: 'Failed to create album: album_images insert failed',
      success: false,
    })
    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(fromMock).not.toHaveBeenCalledWith('family_albums')
    expect(fromMock).not.toHaveBeenCalledWith('album_images')
  })
})
