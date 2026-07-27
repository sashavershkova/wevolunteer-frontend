import type { Opportunity } from '../../types/Opportunity'

// Mirrors the shared seed data described in the DynamoDB table (opp1, opp2,
// opp3, opp7). IDs, titles, organizations, and statuses match the real
// seeded records so these fixtures stay representative of what the live
// API will actually return once opportunityService is wired up.

export const opp1: Opportunity = {
  opportunityId: 'opp1',
  title: 'Food Bank Volunteer Shift',
  description: 'Help sort and package food donations for local families in need.',
  category: 'Food',
  location: 'Seattle, WA',
  date: '2026-07-10',
  status: 'OPEN',
  organizationId: 'org1',
  organizationName: 'Seattle Food Bank',
  capacity: 10,
  registeredCount: 1,
  availableSpots: 9,
}

export const opp2: Opportunity = {
  opportunityId: 'opp2',
  title: 'Community Meal Prep',
  description: 'Prepare meals for community members experiencing food insecurity.',
  category: 'Food',
  location: 'Seattle, WA',
  date: '2026-07-15',
  status: 'OPEN',
  organizationId: 'org1',
  organizationName: 'Seattle Food Bank',
  capacity: 8,
  registeredCount: 8,
  availableSpots: 0,
}

export const opp3: Opportunity = {
  opportunityId: 'opp3',
  title: 'Park Cleanup Day',
  description: 'Join a team effort to clean up litter and debris at a local park.',
  category: 'Environment',
  location: 'Bellevue, WA',
  date: '2026-07-20',
  status: 'OPEN',
  organizationId: 'org2',
  organizationName: 'Green City Cleanup',
  capacity: 20,
  registeredCount: 5,
  availableSpots: 15,
}

export const opp7: Opportunity = {
  opportunityId: 'opp7',
  title: 'Closed Pantry Sorting Shift',
  description: 'Sort and shelve pantry donations for upcoming distribution.',
  category: 'Food',
  location: 'Seattle, WA',
  date: '2026-06-28',
  status: 'CLOSED',
  organizationId: 'org1',
  organizationName: 'Seattle Food Bank',
  capacity: 6,
  registeredCount: 6,
  availableSpots: 0,
}

export const mockOpportunities: Opportunity[] = [opp1, opp2, opp3, opp7]