import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FunBackground } from '@/components/FunBackground'

describe('FunBackground', () => {
  it('should render children', () => {
    render(
      <FunBackground>
        <div data-testid="child">Test Content</div>
      </FunBackground>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should apply default styling classes', () => {
    const { container } = render(
      <FunBackground>
        <div>Content</div>
      </FunBackground>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('relative')
    expect(wrapper).toHaveClass('min-h-screen')
    expect(wrapper).toHaveClass('overflow-hidden')
    expect(wrapper).toHaveClass('bg-[#FFF5D6]')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <FunBackground className="custom-class">
        <div>Content</div>
      </FunBackground>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-class')
  })

  it('should render with empty className', () => {
    const { container } = render(
      <FunBackground className="">
        <div>Content</div>
      </FunBackground>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('relative')
  })

  it('should render without className prop', () => {
    const { container } = render(
      <FunBackground>
        <div>Content</div>
      </FunBackground>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('relative')
  })

  it('should render multiple children', () => {
    render(
      <FunBackground>
        <div data-testid="child1">First</div>
        <div data-testid="child2">Second</div>
        <div data-testid="child3">Third</div>
      </FunBackground>
    )

    expect(screen.getByTestId('child1')).toBeInTheDocument()
    expect(screen.getByTestId('child2')).toBeInTheDocument()
    expect(screen.getByTestId('child3')).toBeInTheDocument()
  })

  it('should render complex children', () => {
    render(
      <FunBackground>
        <div>
          <h1>Title</h1>
          <p>Paragraph</p>
          <button>Button</button>
        </div>
      </FunBackground>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Paragraph')).toBeInTheDocument()
    expect(screen.getByText('Button')).toBeInTheDocument()
  })

  it('should handle null children gracefully', () => {
    render(
      <FunBackground>
        {null}
      </FunBackground>
    )

    // Should render without crashing
    expect(document.body).toBeInTheDocument()
  })

  it('should handle undefined children gracefully', () => {
    render(
      <FunBackground>
        {undefined}
      </FunBackground>
    )

    // Should render without crashing
    expect(document.body).toBeInTheDocument()
  })
})
