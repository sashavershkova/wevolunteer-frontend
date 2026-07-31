import './OrganizationDetailsPreview.css'

const DETAIL_ROWS: { label: string; value: string }[] = [
  { label: 'Organization type', value: 'Not configured' },
  { label: 'Primary location', value: 'Not configured' },
  { label: 'Service area', value: 'Not configured' },
  { label: 'Founded', value: 'Not configured' },
  { label: 'Phone', value: 'Coming soon' },
  { label: 'Social media', value: 'Coming soon' },
]

function OrganizationDetailsPreview() {
  return (
    <section className="organization-details-preview" aria-label="Organization details">
      <div className="organization-details-preview-header">
        <h2>Organization Details</h2>
        <span className="organization-details-preview-badge">Future profile fields</span>
      </div>

      <dl className="organization-details-preview-list">
        {DETAIL_ROWS.map((row) => (
          <div className="organization-details-preview-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default OrganizationDetailsPreview
