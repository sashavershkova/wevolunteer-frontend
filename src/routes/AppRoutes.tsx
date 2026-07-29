import { Route, Routes } from 'react-router-dom'
import LoginPage from '../pages/Login/LoginPage'
import OpportunitiesPage from '../pages/Opportunities/OpportunitiesPage'
import OpportunityDetailsPage from '../pages/OpportunityDetails/OpportunityDetailsPage'
import MyRegistrationsPage from '../pages/MyRegistrations/MyRegistrationsPage'
import OrganizationDashboardPage from '../pages/OrganizationDashboard/OrganizationDashboardPage'
import CreateOpportunityPage from '../pages/CreateOpportunity/CreateOpportunityPage'
import ManageOpportunityPage from '../pages/ManageOpportunity/ManageOpportunityPage'
import OrganizationOpportunityDetailsPage from '../pages/OrganizationOpportunityDetails/OrganizationOpportunityDetailsPage'
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
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/opportunities/:opportunityId" element={<OpportunityDetailsPage />} />
          <Route path="/my-registrations" element={<MyRegistrationsPage />} />
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