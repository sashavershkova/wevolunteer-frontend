import {
  EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
  type RegistrationFilterState,
  type RegistrationFilterStatus,
  type RegistrationOpportunityFiltersValue,
} from '../../../utils/registrationOpportunityFilters'
import { DropdownIcon } from '../../shared/icons'
import DateRangeFilter from '../../opportunities/OpportunityFilters/DateRangeFilter'
import '../../opportunities/OpportunityFilters/OpportunityFilters.css'

type OrganizationRegistrationFiltersProps = {
  value: RegistrationOpportunityFiltersValue
  onChange: (value: RegistrationOpportunityFiltersValue) => void
}

const STATUS_OPTIONS: { value: RegistrationFilterStatus; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CLOSED', label: 'Closed' },
]

const REGISTRATION_STATE_OPTIONS: { value: RegistrationFilterState; label: string }[] = [
  { value: 'ALL', label: 'All Opportunities' },
  { value: 'WITH_REGISTRATIONS', label: 'With Registrations' },
  { value: 'NO_REGISTRATIONS', label: 'No Registrations' },
]

function OrganizationRegistrationFilters({
  value,
  onChange,
}: OrganizationRegistrationFiltersProps) {
  function updateField<K extends keyof RegistrationOpportunityFiltersValue>(
    field: K,
    fieldValue: RegistrationOpportunityFiltersValue[K],
  ) {
    onChange({ ...value, [field]: fieldValue })
  }

  const hasActiveFilters =
    value.search !== '' ||
    value.status !== 'ALL' ||
    value.registrationState !== 'ALL' ||
    value.startDate !== '' ||
    value.endDate !== ''

  return (
    <div className="opportunity-filters">
      <input
        type="search"
        className="opportunity-filters-search"
        placeholder="Search opportunities or volunteers..."
        aria-label="Search"
        value={value.search}
        onChange={(event) => updateField('search', event.target.value)}
      />

      <span className="opportunity-filters-select-wrapper">
        <select
          className="opportunity-filters-select"
          aria-label="Opportunity Status"
          value={value.status}
          onChange={(event) =>
            updateField('status', event.target.value as RegistrationFilterStatus)
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
          aria-label="Registrations"
          value={value.registrationState}
          onChange={(event) =>
            updateField('registrationState', event.target.value as RegistrationFilterState)
          }
        >
          {REGISTRATION_STATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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
          onClick={() => onChange(EMPTY_REGISTRATION_OPPORTUNITY_FILTERS)}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

export default OrganizationRegistrationFilters
