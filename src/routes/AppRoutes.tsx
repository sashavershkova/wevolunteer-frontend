import { Route, Routes } from 'react-router-dom'
import LoginPage from '../pages/Login/LoginPage'
import OpportunitiesPage from '../pages/Opportunities/OpportunitiesPage'
import OpportunityDetailsPage from '../pages/OpportunityDetails/OpportunityDetailsPage'
import MyRegistrationsPage from '../pages/MyRegistrations/MyRegistrationsPage'
import ProfilePage from '../pages/Profile/ProfilePage'
import OrganizationDashboardPage from '../pages/OrganizationDashboard/OrganizationDashboardPage'
import CreateOpportunityPage from '../pages/CreateOpportunity/CreateOpportunityPage'
import ManageOpportunityPage from '../pages/ManageOpportunity/ManageOpportunityPage'
import OrganizationOpportunityDetailsPage from '../pages/OrganizationOpportunityDetails/OrganizationOpportunityDetailsPage'
import DashboardPage from '../pages/Dashboard/DashboardPage'
import FavoritesPage from '../pages/Favorites/FavoritesPage'
import MessagesPage from '../pages/Messages/MessagesPage'
import SettingsPage from '../pages/Settings/SettingsPage'
import ProtectedRoute from './ProtectedRoute'
import HomeRoute from './HomeRoute'
import AppLayout from '../layouts/AppLayout'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/opportunities/:opportunityId" element={<OpportunityDetailsPage />} />
          <Route path="/my-registrations" element={<MyRegistrationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/organization" element={<OrganizationDashboardPage />} />
          <Route path="/organization/opportunities/new" element={<CreateOpportunityPage />} />
          <Route
            path="/organization/opportunities/:opportunityId"
            element={<OrganizationOpportunityDetailsPage />}
          />
          <Route
            path="/organization/opportunities/:opportunityId/edit"
            element={<ManageOpportunityPage />}
          />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes