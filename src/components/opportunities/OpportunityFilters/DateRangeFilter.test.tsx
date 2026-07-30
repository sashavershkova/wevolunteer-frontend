import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import DateRangeFilter from './DateRangeFilter'

// Mimics how a real parent (OpportunityFilters/OpportunitiesPage) drives this
// component: it re-renders with updated startDate/endDate after every
// onChange, which is what lets a second click extend an in-progress range
// instead of starting a brand new one.
function StatefulHarness({ onChange }: { onChange: (start: string, end: string) => void }) {
  const [range, setRange] = useState({ startDate: '', endDate: '' })

  return (
    <DateRangeFilter
      startDate={range.startDate}
      endDate={range.endDate}
      onChange={(startDate, endDate) => {
        setRange({ startDate, endDate })
        onChange(startDate, endDate)
      }}
    />
  )
}

describe('DateRangeFilter', () => {
  it('shows "Any Date" when no range is selected', () => {
    render(<DateRangeFilter startDate="" endDate="" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Any Date/ })).toBeInTheDocument()
  })

  it('shows a formatted range when both dates are set', () => {
    render(
      <DateRangeFilter startDate="2026-07-10" endDate="2026-07-20" onChange={vi.fn()} />,
    )

    expect(
      screen.getByRole('button', { name: /Jul 10 - Jul 20, 2026/ }),
    ).toBeInTheDocument()
  })

  it('opens the calendar dialog when the button is clicked', async () => {
    const user = userEvent.setup()
    render(<DateRangeFilter startDate="" endDate="" onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Any Date/ }))

    expect(
      screen.getByRole('dialog', { name: 'Choose a date range' }),
    ).toBeInTheDocument()
  })

  it('calls onChange with the selected start and end dates', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StatefulHarness onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Any Date/ }))
    await user.click(screen.getByRole('button', { name: /July 10th, 2026/ }))

    expect(onChange).toHaveBeenLastCalledWith('2026-07-10', '2026-07-10')

    await user.click(screen.getByRole('button', { name: /July 20th, 2026/ }))

    expect(onChange).toHaveBeenLastCalledWith('2026-07-10', '2026-07-20')
  })

  it('shows a Clear dates option once a range is selected, and calls onChange with empty values', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DateRangeFilter startDate="2026-07-10" endDate="2026-07-20" onChange={onChange} />,
    )

    await user.click(screen.getByRole('button', { name: /Jul 10 - Jul 20, 2026/ }))
    await user.click(screen.getByRole('button', { name: 'Clear dates' }))

    expect(onChange).toHaveBeenCalledWith('', '')
  })

  it('closes the calendar when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<DateRangeFilter startDate="" endDate="" onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Any Date/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})