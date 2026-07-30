import {
  EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
  type OrganizationVolunteerFiltersValue,
  type VolunteerActivityFilter,
  type VolunteerSort,
  type VolunteerStatusFilter,
} from '../../../utils/organizationVolunteerFilters'
import { DropdownIcon } from '../../shared/icons'
import '../../opportunities/OpportunityFilters/OpportunityFilters.css'

type OrganizationVolunteerFiltersProps = {
  value: OrganizationVolunteerFiltersValue
  onChange: (value: OrganizationVolunteerFiltersValue) => void
}

const STATUS_OPTIONS: { value: VolunteerStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All Volunteers' },
  { value: 'NEW', label: 'New Volunteer' },
  { value: 'RETURNING', label: 'Returning Volunteer' },
  { value: 'FREQUENT', label: 'Frequent Volunteer' },
]

const ACTIVITY_OPTIONS: { value: VolunteerActivityFilter; label: string }[] = [
  { value: 'ALL', label: 'All Activity' },
  { value: 'HAS_UPCOMING', label: 'Has Upcoming Registration' },
  { value: 'HISTORY_ONLY', label: 'Registration History Only' },
]

const SORT_OPTIONS: { value: VolunteerSort; label: string }[] = [
  { value: 'MOST_REGISTRATIONS', label: 'Most Registrations' },
  { value: 'MOST_RECENT', label: 'Most Recently Registered' },
  { value: 'NAME_ASC', label: 'Name A–Z' },
]

function OrganizationVolunteerFilters({ value, onChange }: OrganizationVolunteerFiltersProps) {
  function updateField<K extends keyof OrganizationVolunteerFiltersValue>(
    field: K,
    fieldValue: OrganizationVolunteerFiltersValue[K],
  ) {
    onChange({ ...value, [field]: fieldValue })
  }

  const hasActiveFilters =
    value.search !== EMPTY_ORGANIZATION_VOLUNTEER_FILTERS.search ||
    value.status !== EMPTY_ORGANIZATION_VOLUNTEER_FILTERS.status ||
    value.activity !== EMPTY_ORGANIZATION_VOLUNTEER_FILTERS.activity

  return (
    <div className="opportunity-filters">
      <input
        type="search"
        className="opportunity-filters-search"
        placeholder="Search volunteers..."
        aria-label="Search"
        value={value.search}
        onChange={(event) => updateField('search', event.target.value)}
      />

      <span className="opportunity-filters-select-wrapper">
        <select
          className="opportunity-filters-select"
          aria-label="Volunteer Status"
          value={value.status}
          onChange={(event) => updateField('status', event.target.value as VolunteerStatusFilter)}
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
          aria-label="Activity"
          value={value.activity}
          onChange={(event) =>
            updateField('activity', event.target.value as VolunteerActivityFilter)
          }
        >
          {ACTIVITY_OPTIONS.map((option) => (
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
          aria-label="Sort"
          value={value.sort}
          onChange={(event) => updateField('sort', event.target.value as VolunteerSort)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <DropdownIcon className="opportunity-filters-select-icon" aria-hidden="true" />
      </span>

      {hasActiveFilters && (
        <button
          type="button"
          className="opportunity-filters-clear-button"
          onClick={() => onChange(EMPTY_ORGANIZATION_VOLUNTEER_FILTERS)}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

export default OrganizationVolunteerFilters
