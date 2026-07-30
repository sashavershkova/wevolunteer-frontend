import BrandMark from '../../shared/BrandMark/BrandMark'
import './Footer.css'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <div className="app-footer-brand">
        <BrandMark />
        <span className="app-footer-wordmark">WeVolunteer</span>
      </div>
      <p className="app-footer-copyright">© {year} WeVolunteer. All rights reserved.</p>
      <p className="app-footer-credits">Built by Alexandra, Mariya, Luxi, and Xuan Hien</p>
    </footer>
  )
}

export default Footer
