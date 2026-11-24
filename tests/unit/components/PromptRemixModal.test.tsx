import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptRemixModal } from '@/components/PromptRemixModal'

describe('PromptRemixModal', () => {
  it('keeps the custom prompt visibly labelled and described after typing', async () => {
    const user = userEvent.setup()
    render(
      <PromptRemixModal
        isOpen
        onClose={vi.fn()}
        imageName="Family photo"
        imageUrl="/sample.png"
      />
    )

    const prompt = screen.getByRole('textbox', { name: 'Custom remix prompt' })
    expect(screen.getByLabelText('Custom remix prompt')).toBe(prompt)
    expect(screen.getByText('Custom remix prompt')).toBeVisible()
    expect(prompt).toHaveAccessibleDescription(
      'Describe the new scene or style you want. Keep it playful—think seasons, holidays, hobbies, or dream destinations.'
    )

    await user.type(prompt, 'A winter wonderland')

    expect(prompt).toHaveValue('A winter wonderland')
    expect(prompt).toHaveAccessibleName('Custom remix prompt')
    expect(screen.getByText('Custom remix prompt')).toBeVisible()
    expect(prompt).toHaveAccessibleDescription(
      'Describe the new scene or style you want. Keep it playful—think seasons, holidays, hobbies, or dream destinations.'
    )
  })
})
