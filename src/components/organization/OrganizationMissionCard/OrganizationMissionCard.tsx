import './OrganizationMissionCard.css'

type OrganizationMissionCardProps = {
  description: string
}

function OrganizationMissionCard({ description }: OrganizationMissionCardProps) {
  const trimmedDescription = description.trim()

  return (
    <section className="organization-mission-card" aria-label="Mission and about">
      <h2>Mission &amp; About</h2>

      {trimmedDescription ? (
        <p className="organization-mission-card-description">{description}</p>
      ) : (
        <p className="organization-mission-card-placeholder">
          Add a description to tell volunteers about your organization&rsquo;s mission and
          community impact.
        </p>
      )}

      <p className="organization-mission-card-future-note">
        Expanded mission, impact areas, and organization history will be available in a future
        release.
      </p>
    </section>
  )
}

export default OrganizationMissionCard
