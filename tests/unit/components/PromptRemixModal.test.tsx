import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptRemixModal } from '@/components/PromptRemixModal'

describe('PromptRemixModal', () => {
  it('can be closed using its accessible button', async () => {
    const user = userEvent.setup()

    function Example() {
      const [isOpen, setIsOpen] = useState(false)

      return (
        <>
          <button onClick={() => setIsOpen(true)}>Open prompt remix</button>
          <PromptRemixModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            imageName="Example"
            imageUrl="/example.png"
          />
        </>
      )
    }

    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Open prompt remix' }))
    expect(screen.getByRole('dialog', { name: 'Prompt Remix Playground' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close prompt remix' }))
    expect(screen.queryByRole('dialog', { name: 'Prompt Remix Playground' })).not.toBeInTheDocument()
  })
})
