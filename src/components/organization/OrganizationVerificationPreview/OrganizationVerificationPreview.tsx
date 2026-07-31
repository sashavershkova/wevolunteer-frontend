import './OrganizationVerificationPreview.css'

const VERIFICATION_ROWS: { label: string; value: string }[] = [
  {
    label: 'Email verification',
    value: 'Verification status managed by account authentication',
  },
  { label: 'Organization verification', value: 'Coming soon' },
  { label: 'Nonprofit or business verification', value: 'Coming soon' },
  { label: 'Background-check requirements', value: 'Coming soon' },
]

function OrganizationVerificationPreview() {
  return (
    <section className="organization-verification-preview" aria-label="Verification and trust">
      <h2>Verification &amp; Trust</h2>

      <dl className="organization-verification-preview-list">
        {VERIFICATION_ROWS.map((row) => (
          <div className="organization-verification-preview-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="organization-verification-preview-note">
        Future verification tools will help volunteers understand an organization&rsquo;s
        identity and trust information.
      </p>
    </section>
  )
}

export default OrganizationVerificationPreview
