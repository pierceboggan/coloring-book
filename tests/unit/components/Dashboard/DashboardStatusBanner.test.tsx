import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardStatusBanner } from '@/components/Dashboard/DashboardStatusBanner'

describe('DashboardStatusBanner', () => {
  it('renders count chips', () => {
    render(
      <DashboardStatusBanner
        totalImages={5}
        completedCount={3}
        processingCount={0}
        retryingProcessing={false}
        onRetryStuck={vi.fn()}
      />
    )
    expect(screen.getByText('5 creations')).toBeInTheDocument()
    expect(screen.getByText('3 ready to color')).toBeInTheDocument()
    expect(screen.queryByText(/brewing/i)).not.toBeInTheDocument()
  })

  it('shows brewing chip and retry button when processing', () => {
    const onRetryStuck = vi.fn()
    render(
      <DashboardStatusBanner
        totalImages={5}
        completedCount={3}
        processingCount={2}
        retryingProcessing={false}
        onRetryStuck={onRetryStuck}
      />
    )
    expect(screen.getByText('2 brewing')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Fix stuck pages'))
    expect(onRetryStuck).toHaveBeenCalled()
  })

  it('disables the retry button when already retrying and not processing', () => {
    render(
      <DashboardStatusBanner
        totalImages={5}
        completedCount={3}
        processingCount={0}
        retryingProcessing={true}
        onRetryStuck={vi.fn()}
      />
    )
    const button = screen.getByText('Fix stuck pages').closest('button')
    expect(button).toBeDisabled()
  })
})
