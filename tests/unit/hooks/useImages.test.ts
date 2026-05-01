import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const fromMock = vi.fn()
const channelMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    channel: (...args: unknown[]) => channelMock(...args),
  },
}))

import { useImages } from '@/hooks/useImages'

const buildChain = (data: unknown, error: unknown = null) => {
  const result = { data, error }
  const eqResult = Object.assign(Promise.resolve(result), {
    order: vi.fn().mockReturnValue(Promise.resolve(result)),
  })
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue(eqResult),
    }),
  }
}

describe('useImages', () => {
  beforeEach(() => {
    fromMock.mockReset()
    channelMock.mockReset()

    channelMock.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })
  })

  it('starts in a loading state and skips fetch when userId is null', () => {
    const { result } = renderHook(() => useImages(null))
    expect(result.current.loading).toBe(true)
    expect(result.current.images).toEqual([])
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('fetches images for a user and filters out archived rows', async () => {
    const rows = [
      { id: 'a', name: 'A', status: 'completed', original_url: 'u', created_at: 'd', archived_at: null },
      { id: 'b', name: 'B', status: 'completed', original_url: 'u', created_at: 'd', archived_at: '2025-01-01' },
    ]
    fromMock.mockImplementation(() => buildChain(rows))

    const { result, unmount } = renderHook(() => useImages('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.images.map(img => img.id)).toEqual(['a'])
    unmount()
  })

  it('exposes a refetch function that re-runs the query', async () => {
    fromMock.mockImplementation(() => buildChain([]))

    const { result, unmount } = renderHook(() => useImages('user-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const callsBefore = fromMock.mock.calls.length
    await result.current.refetch()

    expect(fromMock.mock.calls.length).toBeGreaterThan(callsBefore)
    unmount()
  })
})
