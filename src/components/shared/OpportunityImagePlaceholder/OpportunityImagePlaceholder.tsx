import { UploadPhotoIcon } from '../icons'
import './OpportunityImagePlaceholder.css'

function OpportunityImagePlaceholder() {
  return (
    <div className="opportunity-image-placeholder">
      <UploadPhotoIcon aria-hidden="true" className="opportunity-image-placeholder-icon" />
      <p className="opportunity-image-placeholder-text">No image uploaded</p>
      <button type="button" className="opportunity-image-placeholder-button" disabled>
        Upload Image
      </button>
      <p className="opportunity-image-placeholder-note">Coming soon</p>
    </div>
  )
}

export default OpportunityImagePlaceholder
