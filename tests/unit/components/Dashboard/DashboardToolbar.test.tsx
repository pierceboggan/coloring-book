import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardToolbar } from '@/components/Dashboard/DashboardToolbar'

describe('DashboardToolbar', () => {
  const baseProps = {
    viewMode: 'coloring' as const,
    onViewModeChange: vi.fn(),
    layoutMode: 'compact' as const,
    onLayoutModeChange: vi.fn(),
    favoritesOnly: false,
    onFavoritesOnlyToggle: vi.fn(),
    showLayoutSwitch: true,
  }

  it('renders the view mode and favorites buttons', () => {
    render(<DashboardToolbar {...baseProps} />)
    expect(screen.getByText('Coloring pages')).toBeInTheDocument()
    expect(screen.getByText('Uploads')).toBeInTheDocument()
    expect(screen.getByText('Favorites')).toBeInTheDocument()
  })

  it('hides the layout switch when showLayoutSwitch is false', () => {
    render(<DashboardToolbar {...baseProps} showLayoutSwitch={false} />)
    expect(screen.queryByTitle('Compact view')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Expanded view')).not.toBeInTheDocument()
  })

  it('invokes the view mode handler when clicking Uploads', () => {
    const onViewModeChange = vi.fn()
    render(<DashboardToolbar {...baseProps} onViewModeChange={onViewModeChange} />)
    fireEvent.click(screen.getByText('Uploads'))
    expect(onViewModeChange).toHaveBeenCalledWith('uploads')
  })

  it('invokes the favorites toggle when clicking Favorites', () => {
    const onFavoritesOnlyToggle = vi.fn()
    render(<DashboardToolbar {...baseProps} onFavoritesOnlyToggle={onFavoritesOnlyToggle} />)
    fireEvent.click(screen.getByText('Favorites'))
    expect(onFavoritesOnlyToggle).toHaveBeenCalledTimes(1)
  })

  it('invokes the layout mode handler when clicking expanded view', () => {
    const onLayoutModeChange = vi.fn()
    render(<DashboardToolbar {...baseProps} onLayoutModeChange={onLayoutModeChange} />)
    fireEvent.click(screen.getByTitle('Expanded view'))
    expect(onLayoutModeChange).toHaveBeenCalledWith('expanded')
  })
})
