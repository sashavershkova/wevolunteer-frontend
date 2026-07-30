import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppAuth } from '../../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../../services/api/organizationService'
import { closeOpportunity, deleteOpportunity } from '../../../services/api/opportunityService'
import OrganizationOpportunitiesTable from '../OrganizationOpportunitiesTable/OrganizationOpportunitiesTable'
import OrganizationOpportunityFilters from '../OrganizationOpportunityFilters/OrganizationOpportunityFilters'
import type { Opportunity } from '../../../types/Opportunity'
import {
  EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
  filterOrganizationOpportunities,
  type OrganizationOpportunityFiltersValue,
} from '../../../utils/organizationOpportunityFilters'
import { sortOrganizationOpportunities } from '../../../utils/sortOrganizationOpportunities'
import './OrganizationOpportunitiesSection.css'

type OrganizationOpportunitiesSectionProps = {
  headingLevel?: 'h1' | 'h2'
}

function OrganizationOpportunitiesSection({
  headingLevel = 'h2',
}: OrganizationOpportunitiesSectionProps) {
  const HeadingTag = headingLevel
  const auth = useAppAuth()
  const navigate = useNavigate()
  const { accessToken } = auth

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(true)
  const [opportunitiesError, setOpportunitiesError] = useState<string | null>(null)
  const [closingOpportunityId, setClosingOpportunityId] = useState<string | null>(null)
  const [deletingOpportunityId, setDeletingOpportunityId] = useState<string | null>(null)
  const [opportunityActionErrorMessage, setOpportunityActionErrorMessage] =
    useState<string | null>(null)
  const [filters, setFilters] = useState<OrganizationOpportunityFiltersValue>(
    EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
  )

  useEffect(() => {
    let ignore = false

    if (!accessToken) {
      return
    }

    const loadOpportunities = async () => {
      setIsOpportunitiesLoading(true)
      setOpportunitiesError(null)

      try {
        const result = await getMyOrganizationOpportunities(accessToken)

        if (!ignore) {
          setOpportunities(result)
        }
      } catch (error) {
        if (!ignore) {
          setOpportunitiesError(
            error instanceof Error ? error.message : 'Unable to load your opportunities.',
          )
        }
      } finally {
        if (!ignore) {
          setIsOpportunitiesLoading(false)
        }
      }
    }

    void loadOpportunities()

    return () => {
      ignore = true
    }
  }, [accessToken])

  const visibleOpportunities = useMemo(
    () => sortOrganizationOpportunities(filterOrganizationOpportunities(opportunities, filters)),
    [opportunities, filters],
  )

  const emptyMessage =
    opportunities.length === 0
      ? 'You have not created any opportunities yet.'
      : 'No opportunities match the selected filters.'

  async function handleCloseOpportunity(opportunityId: string) {
    if (!accessToken) {
      setOpportunityActionErrorMessage('Your authentication session is unavailable.')
      return
    }

    setOpportunityActionErrorMessage(null)
    setClosingOpportunityId(opportunityId)

    try {
      const updatedOpportunity = await closeOpportunity(accessToken, opportunityId)

      setOpportunities((current) =>
        current.map((opportunity) =>
          opportunity.opportunityId === updatedOpportunity.opportunityId
            ? updatedOpportunity
            : opportunity,
        ),
      )
    } catch (error) {
      setOpportunityActionErrorMessage(
        error instanceof Error ? error.message : 'Unable to close this opportunity.',
      )
    } finally {
      setClosingOpportunityId(null)
    }
  }

  async function handleDeleteOpportunity(opportunityId: string) {
    if (!accessToken) {
      setOpportunityActionErrorMessage('Your authentication session is unavailable.')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this opportunity? This cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    setOpportunityActionErrorMessage(null)
    setDeletingOpportunityId(opportunityId)

    try {
      await deleteOpportunity(accessToken, opportunityId)

      setOpportunities((current) =>
        current.filter((opportunity) => opportunity.opportunityId !== opportunityId),
      )
    } catch (error) {
      setOpportunityActionErrorMessage(
        error instanceof Error ? error.message : 'Unable to delete this opportunity.',
      )
    } finally {
      setDeletingOpportunityId(null)
    }
  }

  return (
    <div className="organization-opportunities-section">
      <div className="organization-opportunities-section-header">
        <HeadingTag>My Opportunities</HeadingTag>

        <button
          type="button"
          className="organization-opportunities-create-button"
          onClick={() => navigate('/organization/opportunities/new')}
        >
          + Create New Opportunity
        </button>
      </div>

      {opportunityActionErrorMessage && (
        <p role="alert" className="organization-opportunities-section-error">
          {opportunityActionErrorMessage}
        </p>
      )}

      {!isOpportunitiesLoading && !opportunitiesError && (
        <OrganizationOpportunityFilters
          opportunities={opportunities}
          value={filters}
          onChange={setFilters}
        />
      )}

      <OrganizationOpportunitiesTable
        opportunities={visibleOpportunities}
        isLoading={isOpportunitiesLoading}
        error={opportunitiesError}
        onCloseOpportunity={handleCloseOpportunity}
        closingOpportunityId={closingOpportunityId}
        onDeleteOpportunity={handleDeleteOpportunity}
        deletingOpportunityId={deletingOpportunityId}
        emptyMessage={emptyMessage}
      />
    </div>
  )
}

export default OrganizationOpportunitiesSection
