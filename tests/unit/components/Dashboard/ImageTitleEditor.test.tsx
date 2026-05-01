import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageTitleEditor } from '@/components/Dashboard/ImageTitleEditor'
import type { UserImage } from '@/components/Dashboard/types'

const image: UserImage = {
  id: 'img-1',
  name: 'Sunset',
  original_url: 'https://example.com/o.png',
  status: 'completed',
  created_at: '2025-01-01T00:00:00.000Z',
}

describe('ImageTitleEditor', () => {
  it('renders the image name and a rename button by default', () => {
    render(<ImageTitleEditor image={image} isSaving={false} onSave={vi.fn()} />)
    expect(screen.getByText('Sunset')).toBeInTheDocument()
    expect(screen.getByTitle('Rename')).toBeInTheDocument()
  })

  it('switches to edit mode when rename is clicked', () => {
    render(<ImageTitleEditor image={image} isSaving={false} onSave={vi.fn()} />)
    fireEvent.click(screen.getByTitle('Rename'))
    expect(screen.getByLabelText('Image name')).toHaveValue('Sunset')
  })

  it('cancels editing on Escape', () => {
    render(<ImageTitleEditor image={image} isSaving={false} onSave={vi.fn()} />)
    fireEvent.click(screen.getByTitle('Rename'))
    const input = screen.getByLabelText('Image name')
    fireEvent.change(input, { target: { value: 'Other' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.getByText('Sunset')).toBeInTheDocument()
  })

  it('calls onSave with the trimmed name when Save clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ImageTitleEditor image={image} isSaving={false} onSave={onSave} />)
    fireEvent.click(screen.getByTitle('Rename'))
    const input = screen.getByLabelText('Image name')
    fireEvent.change(input, { target: { value: '  Beach  ' } })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Beach'))
  })

  it('shows Saving state when isSaving is true', () => {
    render(<ImageTitleEditor image={image} isSaving={true} onSave={vi.fn()} />)
    fireEvent.click(screen.getByTitle('Rename'))
    expect(screen.getByText('Saving')).toBeInTheDocument()
  })

  it('alerts and does not call onSave when the trimmed value is empty', async () => {
    const onSave = vi.fn()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<ImageTitleEditor image={image} isSaving={false} onSave={onSave} />)
    fireEvent.click(screen.getByTitle('Rename'))
    const input = screen.getByLabelText('Image name')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(screen.getByText('Save'))
    expect(alertSpy).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })

  it('cancels editing when the value is unchanged', () => {
    const onSave = vi.fn()
    render(<ImageTitleEditor image={image} isSaving={false} onSave={onSave} />)
    fireEvent.click(screen.getByTitle('Rename'))
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Sunset')).toBeInTheDocument()
  })

  it('submits when pressing Enter in the input', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ImageTitleEditor image={image} isSaving={false} onSave={onSave} />)
    fireEvent.click(screen.getByTitle('Rename'))
    const input = screen.getByLabelText('Image name')
    fireEvent.change(input, { target: { value: 'Beach' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Beach'))
  })

  it('stays in edit mode when onSave throws', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('boom'))
    render(<ImageTitleEditor image={image} isSaving={false} onSave={onSave} />)
    fireEvent.click(screen.getByTitle('Rename'))
    const input = screen.getByLabelText('Image name')
    fireEvent.change(input, { target: { value: 'Beach' } })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(screen.getByLabelText('Image name')).toBeInTheDocument()
  })
})
