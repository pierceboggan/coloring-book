import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardEmptyState } from '@/components/Dashboard/DashboardEmptyState'

describe('DashboardEmptyState', () => {
  it('shows the coloring empty state copy by default', () => {
    render(
      <DashboardEmptyState
        variant="coloring"
        favoritesOnly={false}
        onShowAll={vi.fn()}
        onShowUploader={vi.fn()}
      />
    )
    expect(screen.getByText('No coloring pages yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Upload photos/i })).toBeInTheDocument()
  })

  it('shows favorites copy and Show all button when favoritesOnly is true', () => {
    const onShowAll = vi.fn()
    render(
      <DashboardEmptyState
        variant="coloring"
        favoritesOnly={true}
        onShowAll={onShowAll}
        onShowUploader={vi.fn()}
      />
    )
    expect(screen.getByText('No favorite coloring pages yet')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Show all pages'))
    expect(onShowAll).toHaveBeenCalled()
  })

  it('shows the uploads variant copy', () => {
    render(
      <DashboardEmptyState
        variant="uploads"
        favoritesOnly={false}
        onShowAll={vi.fn()}
        onShowUploader={vi.fn()}
      />
    )
    expect(screen.getByText('No uploads yet')).toBeInTheDocument()
  })

  it('triggers onShowUploader when the upload button is clicked', () => {
    const onShowUploader = vi.fn()
    render(
      <DashboardEmptyState
        variant="uploads"
        favoritesOnly={false}
        onShowAll={vi.fn()}
        onShowUploader={onShowUploader}
      />
    )
    fireEvent.click(screen.getByText('Upload photos'))
    expect(onShowUploader).toHaveBeenCalled()
  })
})
