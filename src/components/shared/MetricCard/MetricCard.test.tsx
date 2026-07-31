import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Clock } from 'lucide-react'
import MetricCard from './MetricCard'

describe('MetricCard', () => {
  it('renders the label, value, and hint', () => {
    render(<MetricCard label="Hours contributed" value="38.5" hint="From completed opportunities" />)

    expect(screen.getByText('Hours contributed')).toBeInTheDocument()
    expect(screen.getByText('38.5')).toBeInTheDocument()
    expect(screen.getByText('From completed opportunities')).toBeInTheDocument()
  })

  it('renders a numeric value', () => {
    render(<MetricCard label="Total" value={12} hint="Count" />)

    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders an icon when provided', () => {
    const { container } = render(
      <MetricCard label="Hours contributed" value="38.5" hint="Hint" icon={Clock} />,
    )

    expect(container.querySelector('.metric-card-icon')).toBeInTheDocument()
  })

  it('renders no icon when none is provided', () => {
    const { container } = render(<MetricCard label="Total" value={12} hint="Count" />)

    expect(container.querySelector('.metric-card-icon')).not.toBeInTheDocument()
  })
})