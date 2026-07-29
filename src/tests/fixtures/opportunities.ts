import type { Opportunity } from '../../types/Opportunity'

// Mirrors the shared seed data described in the DynamoDB table (opp1, opp2,
// opp3, opp7). IDs, titles, organizations, and statuses match the real
// seeded records so these fixtures stay representative of what the live
// API will actually return once opportunityService is wired up.
//
// startTime/endTime/time/whatYoullDo/recurring are deliberately varied across
// fixtures so tests exercise a fully-populated structured opportunity (opp1,
// opp3), one written before any time field existed with everything null
// (opp2), and one written before startTime/endTime existed that still
// carries only the legacy free-text time (opp7) - see
// DynamoDbOpportunityRepository on the backend for the read-side defaulting
// this mirrors.

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
  time: null,
  startTime: '09:00',
  endTime: '12:00',
  whatYoullDo: ['Sort and organize food items', 'Pack boxes for distribution'],
  recurring: false,
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
  time: null,
  startTime: null,
  endTime: null,
  whatYoullDo: [],
  recurring: false,
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
  time: null,
  startTime: '14:30',
  endTime: '16:45',
  whatYoullDo: ['Pick up litter', 'Spread mulch in garden beds'],
  recurring: true,
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
  time: '9:00 AM - 12:00 PM',
  startTime: null,
  endTime: null,
  whatYoullDo: [],
  recurring: false,
}

export const mockOpportunities: Opportunity[] = [opp1, opp2, opp3, opp7]
