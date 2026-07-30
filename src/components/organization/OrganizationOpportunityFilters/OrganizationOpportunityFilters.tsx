import type { Opportunity } from '../../../types/Opportunity'
import { getUniqueSortedValues } from '../../../utils/opportunityFilters'
import type {
  OrganizationOpportunityFiltersValue,
  OrganizationOpportunityStatusFilter,
} from '../../../utils/organizationOpportunityFilters'
import { EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS } from '../../../utils/organizationOpportunityFilters'
import { DropdownIcon } from '../../shared/icons'
import DateRangeFilter from '../../opportunities/OpportunityFilters/DateRangeFilter'
import '../../opportunities/OpportunityFilters/OpportunityFilters.css'

type OrganizationOpportunityFiltersProps = {
  opportunities: Opportunity[]
  value: OrganizationOpportunityFiltersValue
  onChange: (value: OrganizationOpportunityFiltersValue) => void
}

const STATUS_OPTIONS: { value: OrganizationOpportunityStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CLOSED', label: 'Closed' },
]

function OrganizationOpportunityFilters({
  opportunities,
  value,
  onChange,
}: OrganizationOpportunityFiltersProps) {
  const categories = getUniqueSortedValues(opportunities, 'category')
  const locations = getUniqueSortedValues(opportunities, 'location')

  function updateField<K extends keyof OrganizationOpportunityFiltersValue>(
    field: K,
    fieldValue: OrganizationOpportunityFiltersValue[K],
  ) {
    onChange({ ...value, [field]: fieldValue })
  }

  const hasActiveFilters =
    value.status !== 'ALL' ||
    value.category !== '' ||
    value.location !== '' ||
    value.startDate !== '' ||
    value.endDate !== ''

  return (
    <div className="opportunity-filters">
      <span className="opportunity-filters-select-wrapper">
        <select
          className="opportunity-filters-select"
          aria-label="Filter by status"
          value={value.status}
          onChange={(event) =>
            updateField('status', event.target.value as OrganizationOpportunityStatusFilter)
          }
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <DropdownIcon className="opportunity-filters-select-icon" aria-hidden="true" />
      </span>

      <span className="opportunity-filters-select-wrapper">
        <select
          className="opportunity-filters-select"
          aria-label="Filter by category"
          value={value.category}
          onChange={(event) => updateField('category', event.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <DropdownIcon className="opportunity-filters-select-icon" aria-hidden="true" />
      </span>

      <span className="opportunity-filters-select-wrapper">
        <select
          className="opportunity-filters-select"
          aria-label="Filter by location"
          value={value.location}
          onChange={(event) => updateField('location', event.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
        <DropdownIcon className="opportunity-filters-select-icon" aria-hidden="true" />
      </span>

      <DateRangeFilter
        startDate={value.startDate}
        endDate={value.endDate}
        onChange={(startDate, endDate) => onChange({ ...value, startDate, endDate })}
      />

      {hasActiveFilters && (
        <button
          type="button"
          className="opportunity-filters-clear-button"
          onClick={() => onChange(EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS)}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

export default OrganizationOpportunityFilters
