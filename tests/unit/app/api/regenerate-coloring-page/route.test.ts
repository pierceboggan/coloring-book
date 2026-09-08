import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  imageSingle: vi.fn(),
  regenerationSingle: vi.fn(),
  regenerationInsert: vi.fn(),
  imageIdEq: vi.fn(),
  regenerationImageEq: vi.fn(),
  regenerationUserEq: vi.fn(),
  generateColoringPageWithCustomPrompt: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mocks.authGetUser,
    },
  })),
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'images') {
        return {
          select: vi.fn(() => ({
            eq: mocks.imageIdEq,
          })),
        }
      }

      if (table === 'image_regenerations') {
        return {
          select: vi.fn(() => ({
            eq: mocks.regenerationImageEq,
          })),
          insert: mocks.regenerationInsert,
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  },
}))

vi.mock('@/lib/openai', () => ({
  isImageGenerationProvider: vi.fn(() => false),
  generateColoringPageWithCustomPrompt: mocks.generateColoringPageWithCustomPrompt,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

import { POST } from '@/app/api/regenerate-coloring-page/route'

function createRequest(body: Record<string, unknown>) {
  return createRawRequest(JSON.stringify(body))
}

function createRawRequest(body: string) {
  return new NextRequest('http://localhost/api/regenerate-coloring-page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: 'sb-access-token=session-token',
    },
    body,
  })
}

describe('POST /api/regenerate-coloring-page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.imageIdEq.mockReturnValue({
      single: mocks.imageSingle,
    })
    mocks.regenerationImageEq.mockReturnValue({
      eq: mocks.regenerationUserEq,
    })
    mocks.regenerationUserEq.mockReturnValue({
      single: mocks.regenerationSingle,
    })
  })

  it('regenerates an owned image using the authenticated user ID', async () => {
    mocks.authGetUser.mockResolvedValue({
      data: { user: { id: 'authenticated-user' } },
      error: null,
    })
    mocks.imageSingle.mockResolvedValue({
      data: {
        id: 'image-1',
        user_id: 'authenticated-user',
        original_url: 'https://example.com/original.png',
        coloring_page_url: 'https://example.com/coloring-page.png',
      },
      error: null,
    })
    mocks.regenerationSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    })
    mocks.generateColoringPageWithCustomPrompt.mockResolvedValue(
      'https://example.com/regenerated.png'
    )
    mocks.regenerationInsert.mockResolvedValue({ error: null })

    const response = await POST(createRequest({
      imageId: 'image-1',
      feedback: 'Use thicker lines',
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      regeneratedColoringPageUrl: 'https://example.com/regenerated.png',
    })
    expect(mocks.regenerationUserEq).toHaveBeenCalledWith('user_id', 'authenticated-user')
    expect(mocks.regenerationInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        image_id: 'image-1',
        user_id: 'authenticated-user',
      })
    )
  })

  it('rejects regeneration when the authenticated user does not own the image', async () => {
    mocks.authGetUser.mockResolvedValue({
      data: { user: { id: 'requesting-user' } },
      error: null,
    })
    mocks.imageSingle.mockResolvedValue({
      data: {
        id: 'image-1',
        user_id: 'different-user',
        original_url: 'https://example.com/original.png',
        coloring_page_url: 'https://example.com/coloring-page.png',
      },
      error: null,
    })

    const response = await POST(createRequest({
      imageId: 'image-1',
      feedback: 'Use thicker lines',
    }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: 'You do not have permission to regenerate this image',
    })
    expect(mocks.regenerationSingle).not.toHaveBeenCalled()
    expect(mocks.generateColoringPageWithCustomPrompt).not.toHaveBeenCalled()
    expect(mocks.regenerationInsert).not.toHaveBeenCalled()
  })

  it('returns 400 for malformed JSON', async () => {
    const response = await POST(createRawRequest('{'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Request body must be valid JSON',
    })
    expect(mocks.authGetUser).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid request shape', async () => {
    const response = await POST(createRequest({
      imageId: 'image-1',
      feedback: 42,
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'A valid imageId and optional feedback string are required',
    })
    expect(mocks.authGetUser).not.toHaveBeenCalled()
  })
})
