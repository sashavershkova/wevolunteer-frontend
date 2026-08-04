import type { Registration } from '../../../services/api/registrationService'
import {
    getUniqueSortedVolunteerRegistrationValues,
    type VolunteerRegistrationFiltersValue,
} from '../../../utils/volunteerRegistrationFilters'
import { DropdownIcon } from '../../shared/icons'
import DateRangeFilter from '../../opportunities/OpportunityFilters/DateRangeFilter'
import './VolunteerRegistrationFilters.css'

type VolunteerRegistrationFiltersProps = {
    registrations: Registration[]
    value: VolunteerRegistrationFiltersValue
    onChange: (value: VolunteerRegistrationFiltersValue) => void
}

function VolunteerRegistrationFilters({
    registrations,
    value,
    onChange,
}: VolunteerRegistrationFiltersProps) {
    const locations = getUniqueSortedVolunteerRegistrationValues(registrations, 'location')
    const organizations = getUniqueSortedVolunteerRegistrationValues(
        registrations,
        'organizationName',
    )

    function updateField<K extends keyof VolunteerRegistrationFiltersValue>(
        field: K,
        fieldValue: VolunteerRegistrationFiltersValue[K],
    ) {
        onChange({ ...value, [field]: fieldValue })
    }

    const hasActiveFilters =
        value.search !== '' ||
        value.location !== '' ||
        value.organizationName !== '' ||
        value.startDate !== '' ||
        value.endDate !== ''

    return (
        <div className="volunteer-registration-filters">
        <input
            type="search"
            className="volunteer-registration-filters-search"
            placeholder="Search your registrations..."
            aria-label="Search registrations"
            value={value.search}
            onChange={(event) => updateField('search', event.target.value)}
        />

        <span className="volunteer-registration-filters-select-wrapper">
            <select
            className="volunteer-registration-filters-select"
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
            <DropdownIcon className="volunteer-registration-filters-select-icon" aria-hidden="true" />
        </span>

        <span className="volunteer-registration-filters-select-wrapper">
            <select
            className="volunteer-registration-filters-select"
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
            <DropdownIcon className="volunteer-registration-filters-select-icon" aria-hidden="true" />
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
            className="volunteer-registration-filters-clear-button"
            onClick={() =>
                onChange({
                search: '',
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

export default VolunteerRegistrationFilters