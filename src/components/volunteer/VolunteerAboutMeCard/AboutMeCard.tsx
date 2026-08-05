import './AboutMeCard.css'

// Volunteers don't have a bio or interests field yet, so this shows sample
// content to preview what the real feature will look like once it exists -
// clearly framed as a preview rather than the volunteer's actual saved data.
const SAMPLE_INTERESTS = ['Animals', 'Environment', 'Food & Hunger Relief', 'Community Outreach']

function AboutMeCard() {
  return (
    <section className="about-me-card" aria-label="About me">
      <h2>About Me</h2>

      <p className="about-me-card-bio">
        I love volunteering at local pet shelters and spending time with animals who are
        waiting for their forever homes. There&rsquo;s nothing better than seeing a rescue
        animal find a family that loves them.
      </p>

      <ul className="about-me-card-interests" aria-label="Interests">
        {SAMPLE_INTERESTS.map((interest) => (
          <li key={interest} className="about-me-card-interest-tag">
            {interest}
          </li>
        ))}
      </ul>

      <p className="about-me-card-future-note">
        This is a preview of what your profile could look like. A real bio and interest tags
        will be editable in a future release.
      </p>
    </section>
  )
}

export default AboutMeCard