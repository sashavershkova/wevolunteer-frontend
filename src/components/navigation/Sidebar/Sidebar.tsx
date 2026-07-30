import { NavLink } from 'react-router-dom'
import { useAppAuth } from '../../../contexts/AuthContext'
import {
  BrowseOpportunitiesIcon,
  DashboardIcon,
  FavoritesIcon,
  LogOutIcon,
  MessagesIcon,
  OpportunitiesIcon,
  ProfileIcon,
  RegistrationsIcon,
  SettingsIcon,
  VolunteersIcon,
} from '../../shared/icons'
import './Sidebar.css'

type SidebarItem = {
  to: string
  label: string
  Icon: typeof DashboardIcon
}

const VOLUNTEER_ITEMS: SidebarItem[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/opportunities', label: 'Browse Opportunities', Icon: BrowseOpportunitiesIcon },
  { to: '/my-registrations', label: 'My Registrations', Icon: RegistrationsIcon },
  { to: '/profile', label: 'My Profile', Icon: ProfileIcon },
  { to: '/favorites', label: 'Favorites', Icon: FavoritesIcon },
  { to: '/messages', label: 'Messages', Icon: MessagesIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
]

const ORGANIZATION_ITEMS: SidebarItem[] = [
  { to: '/organization', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/organization', label: 'My Opportunities', Icon: OpportunitiesIcon },
  { to: '/organization/registrations', label: 'Registrations', Icon: RegistrationsIcon },
  { to: '/organization/volunteers', label: 'Volunteers', Icon: VolunteersIcon },
  { to: '/organization/messages', label: 'Messages', Icon: MessagesIcon },
  { to: '/organization/profile', label: 'Organization Profile', Icon: ProfileIcon },
  { to: '/organization/settings', label: 'Settings', Icon: SettingsIcon },
]

function navLinkClassName({ isActive }: { isActive: boolean }): string | undefined {
  return isActive ? 'is-active' : undefined
}

function Sidebar() {
  const auth = useAppAuth()

  const items = auth.userProfile
    ? VOLUNTEER_ITEMS
    : auth.organizationProfile
      ? ORGANIZATION_ITEMS
      : null

  if (!items) {
    return null
  }

  return (
    <nav className="app-sidebar" aria-label="Sidebar">
      <div className="app-sidebar-links">
        {items.map((item) => (
          <NavLink key={item.label} to={item.to} className={navLinkClassName}>
            <item.Icon aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <button type="button" className="app-sidebar-logout" onClick={() => auth.signOut()}>
        <LogOutIcon aria-hidden="true" />
        Log Out
      </button>
    </nav>
  )
}

export default Sidebar
