import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { VariantsModal } from '@/components/VariantsModal'

const props = {
  isOpen: true,
  onClose: vi.fn(),
  imageId: 'image-1',
  imageName: 'Sample image',
  originalUrl: '/sample.png',
  variants: [],
  onVariantsUpdated: vi.fn(),
  onUseVariant: vi.fn().mockResolvedValue(undefined),
}

describe('VariantsModal', () => {
  it('associates the custom scene label with the editable textarea', () => {
    render(<VariantsModal {...props} />)

    const textarea = screen.getByRole('textbox', { name: 'Custom scene (optional)' })
    expect(screen.getByLabelText('Custom scene (optional)')).toBe(textarea)
    fireEvent.change(textarea, { target: { value: 'A magical garden' } })
    expect(textarea).toHaveValue('A magical garden')
  })

  it('uses a distinct textarea id for each instance', () => {
    render(<><VariantsModal {...props} /><VariantsModal {...props} /></>)

    const textareas = screen.getAllByRole('textbox', { name: 'Custom scene (optional)' })
    expect(textareas[0].id).not.toBe(textareas[1].id)
  })
})
