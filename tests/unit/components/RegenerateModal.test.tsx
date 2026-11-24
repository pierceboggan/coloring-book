import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegenerateModal } from '@/components/RegenerateModal'

describe('RegenerateModal', () => {
  it('associates the feedback label and tip with the textarea', async () => {
    const user = userEvent.setup()
    render(
      <RegenerateModal
        isOpen
        onClose={vi.fn()}
        imageId="image-1"
        imageName="Example"
        currentColoringPageUrl="/example.png"
        onRegenerateComplete={vi.fn()}
      />
    )

    const field = screen.getByRole('textbox', { name: 'What would you like to change? (Optional)' })
    expect(field).toHaveAccessibleDescription(
      'Tip: mention line weight, detail level, or mood so our crayons know what to adjust.'
    )
    await user.click(screen.getByText('What would you like to change? (Optional)'))
    expect(field).toHaveFocus()
  })
})
