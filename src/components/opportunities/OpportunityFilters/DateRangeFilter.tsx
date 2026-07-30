import { useEffect, useRef, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { format, parseISO } from 'date-fns'
import { DateIcon } from '../../shared/icons'
import 'react-day-picker/style.css'
import './DateRangeFilter.css'

type DateRangeFilterProps = {
  startDate: string
  endDate: string
  onChange: (startDate: string, endDate: string) => void
}

function toDate(value: string): Date | undefined {
  return value ? parseISO(value) : undefined
}

function formatRangeLabel(startDate: string, endDate: string): string {
  if (!startDate && !endDate) {
    return 'Any Date'
  }

  if (startDate && !endDate) {
    return `From ${format(parseISO(startDate), 'MMM d, yyyy')}`
  }

  if (!startDate && endDate) {
    return `Until ${format(parseISO(endDate), 'MMM d, yyyy')}`
  }

  return `${format(parseISO(startDate), 'MMM d')} - ${format(
    parseISO(endDate),
    'MMM d, yyyy',
  )}`
}

function DateRangeFilter({ startDate, endDate, onChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const selectedRange: DateRange | undefined =
    startDate || endDate ? { from: toDate(startDate), to: toDate(endDate) } : undefined

  function handleSelect(range: DateRange | undefined) {
    onChange(
      range?.from ? format(range.from, 'yyyy-MM-dd') : '',
      range?.to ? format(range.to, 'yyyy-MM-dd') : '',
    )
  }

  function handleClear() {
    onChange('', '')
    setIsOpen(false)
  }

  return (
    <div className="date-range-filter" ref={containerRef}>
      <button
        type="button"
        className="date-range-filter-button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <DateIcon className="date-range-filter-icon" aria-hidden="true" />
        {formatRangeLabel(startDate, endDate)}
      </button>

      {isOpen && (
        <div
          className="date-range-filter-popover"
          role="dialog"
          aria-label="Choose a date range"
        >
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            defaultMonth={selectedRange?.from}
          />
          {(startDate || endDate) && (
            <button
              type="button"
              className="date-range-filter-clear"
              onClick={handleClear}
            >
              Clear dates
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default DateRangeFilter