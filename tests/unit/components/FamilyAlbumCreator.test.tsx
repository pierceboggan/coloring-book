import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FamilyAlbumCreator } from '@/components/FamilyAlbumCreator'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

const images = ['Rocket', 'Garden'].map((name, index) => ({
  id: `image-${index}`,
  name,
  original_url: `/original-${index}.png`,
  coloring_page_url: `/coloring-${index}.png`,
  status: 'completed' as const,
  created_at: '2026-01-01T00:00:00.000Z',
}))

describe('FamilyAlbumCreator selection accessibility', () => {
  it('exposes the cover selection and updates it with keyboard activation and removal', async () => {
    const user = userEvent.setup()
    render(<FamilyAlbumCreator images={images} onClose={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /Cover image/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Rocket/ }))
    await user.click(screen.getByRole('button', { name: /Garden/ }))

    const rocket = screen.getByRole('button', { name: 'Cover image Rocket', pressed: true })
    const garden = screen.getByRole('button', { name: 'Cover image Garden', pressed: false })
    rocket.focus()
    await user.tab()
    expect(garden).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(garden).toHaveAttribute('aria-pressed', 'true')
    expect(rocket).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getAllByRole('button', { name: 'Remove', exact: true })[1])
    expect(screen.queryByRole('button', { name: 'Cover image Garden' })).not.toBeInTheDocument()
    expect(rocket).toHaveAttribute('aria-pressed', 'true')
  })

  it('exposes exactly one pressed expiration choice as keyboard selection changes', async () => {
    const user = userEvent.setup()
    render(<FamilyAlbumCreator images={images} onClose={vi.fn()} />)

    const choices = ['Never', '7 days', '30 days', 'Pick a date']
      .map(name => screen.getByRole('button', { name, exact: true }))

    expect(choices[0]).toHaveAttribute('aria-pressed', 'true')
    for (const choice of choices.slice(1)) {
      expect(choice).toHaveAttribute('aria-pressed', 'false')
    }

    choices[0].focus()
    for (const choice of choices.slice(1)) {
      await user.tab()
      expect(choice).toHaveFocus()
      await user.keyboard(' ')
      for (const option of choices) {
        expect(option).toHaveAttribute('aria-pressed', String(option === choice))
      }
    }
  })
})
