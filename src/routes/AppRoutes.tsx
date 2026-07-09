import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../pages/Login/LoginPage'
import OpportunitiesPage from '../pages/Opportunities/OpportunitiesPage'
import OpportunityDetailsPage from '../pages/OpportunityDetails/OpportunityDetailsPage'
import MyRegistrationsPage from '../pages/MyRegistrations/MyRegistrationsPage'
import OrganizationDashboardPage from '../pages/OrganizationDashboard/OrganizationDashboardPage'
import ProtectedRoute from './ProtectedRoute'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/opportunities" replace />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/opportunities/:opportunityId" element={<OpportunityDetailsPage />} />
        <Route path="/my-registrations" element={<MyRegistrationsPage />} />
        <Route path="/organization" element={<OrganizationDashboardPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes