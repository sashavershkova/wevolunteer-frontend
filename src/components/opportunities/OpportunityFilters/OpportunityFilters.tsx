import type { Opportunity } from '../../../types/Opportunity'
import {
  getUniqueSortedValues,
  type OpportunityFiltersValue,
} from '../../../utils/opportunityFilters'
import { DropdownIcon } from '../../shared/icons'
import DateRangeFilter from './DateRangeFilter'
import './OpportunityFilters.css'

type OpportunityFiltersProps = {
  opportunities: Opportunity[]
  value: OpportunityFiltersValue
  onChange: (value: OpportunityFiltersValue) => void
}

function OpportunityFilters({
  opportunities,
  value,
  onChange,
}: OpportunityFiltersProps) {
    const categories = getUniqueSortedValues(opportunities, 'category')
    const locations = getUniqueSortedValues(opportunities, 'location')
    const organizations = getUniqueSortedValues(opportunities, 'organizationName')

    function updateField<K extends keyof OpportunityFiltersValue>(
        field: K,
        fieldValue: OpportunityFiltersValue[K],
    ) {
        onChange({ ...value, [field]: fieldValue })
    }

    const hasActiveFilters =
        value.search !== '' ||
        value.category !== '' ||
        value.location !== '' ||
        value.organizationName !== '' ||
        value.startDate !== '' ||
        value.endDate !== ''

    return (
        <div className="opportunity-filters">
        <input
            type="search"
            className="opportunity-filters-search"
            placeholder="Search opportunities..."
            aria-label="Search opportunities"
            value={value.search}
            onChange={(event) => updateField('search', event.target.value)}
        />

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

        <span className="opportunity-filters-select-wrapper">
            <select
            className="opportunity-filters-select"
            aria-label="Filter by organization"
            value={value.organizationName}
            onChange={(event) => updateField('organizationName', event.target.value)}
            >
            <option value="">All Organizations</option>
            {organizations.map((organizationName) => (
                <option key={organizationName} value={organizationName}>
                {organizationName}
                </option>
            ))}
            </select>
            <DropdownIcon className="opportunity-filters-select-icon" aria-hidden="true" />
        </span>

        <DateRangeFilter
            startDate={value.startDate}
            endDate={value.endDate}
            onChange={(startDate, endDate) =>
            onChange({ ...value, startDate, endDate })
            }
        />

        {hasActiveFilters && (
            <button
            type="button"
            className="opportunity-filters-clear-button"
            onClick={() =>
                onChange({
                search: '',
                category: '',
                location: '',
                organizationName: '',
                startDate: '',
                endDate: '',
                })
            }
            >
            Clear filters
            </button>
        )}
        </div>
    )
}

export default OpportunityFilters