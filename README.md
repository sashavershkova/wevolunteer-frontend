# WeVolunteer Frontend

React + TypeScript single-page application for WeVolunteer, a volunteer/organization
matching platform built as an ADA C#25 capstone project. Volunteers browse and register
for opportunities; organizations post and manage them. The app authenticates through
Amazon Cognito's Hosted UI and talks to the
[WeVolunteer Spring Boot backend](https://github.com/sashavershkova/wevolunteer-backend)
over a JSON REST API.

This document reflects what is verifiably implemented in the code on `main`. Anywhere a
detail could not be confirmed from this repository, it is labeled instead of guessed.

---

## Features

- Amazon Cognito Hosted UI authentication (sign in, sign up, sign out)
- Protected routes with loading/auth-error handling
- Role-based experience: one route tree renders either a volunteer or an organization UI,
  based on which profile exists for the signed-in identity
- Onboarding flow that creates a volunteer or organization profile after first sign-in
- Opportunity browsing with search, category/location/organization/date-range filtering
- Registering, cancelling, favoriting, and waitlisting for opportunities
- Volunteer dashboard, "My Registrations" page, and editable profile with photo upload
- Organization dashboard, opportunity management (create/edit/close/reopen/delete),
  registrations + waitlist view, a client-aggregated volunteer directory, and an editable
  organization profile with logo upload
- Light/dark theme toggle, persisted to `localStorage`
- Responsive layout with a collapsible mobile sidebar

**Placeholder / not implemented** (render static "Coming Soon" UI, no backend calls):
Messages (volunteer and organization), most of Settings (notifications, integrations,
security, data & privacy), and the header's notification bell.

---

## Project Links

- **Recorded Demo:** Coming soon
- **Final Presentation:** Coming soon
- **Frontend Repository:** https://github.com/sashavershkova/wevolunteer-frontend
- **Backend Repository:** https://github.com/sashavershkova/wevolunteer-backend

---

## Architecture

```
Browser → React SPA (this repo, Vite build)
        → Amazon Cognito Hosted UI (OAuth2/OIDC Authorization Code flow, issues a JWT)
        → Spring Boot backend (separate repo, REST API/JSON)
             — every request carries `Authorization: Bearer <token>`
        → Amazon S3 (profile + opportunity images)
             — browser uploads directly via pre-signed URLs the backend issues;
               image bytes never pass through the backend
```

There is no server-side rendering and no backend-for-frontend layer. There is no global
state store — app-wide state is two React contexts (OIDC session, and this app's own
`AuthContext`, which also resolves whether the signed-in identity is a volunteer or an
organization). Each page fetches its own data with `useEffect` + `fetch` and filters/sorts
it client-side; there is no shared cache/query layer.

---

## Tech stack

| Concern | Technology | Where |
|---|---|---|
| Language | TypeScript | `tsconfig*.json` |
| UI library | React 19 | `package.json` |
| Build tool / dev server | Vite 8 (`@vitejs/plugin-react`) | `vite.config.ts` |
| Routing | React Router 7, client-side only | `src/routes/` |
| Authentication | Amazon Cognito Hosted UI via `react-oidc-context` / `oidc-client-ts` | `src/services/auth/` |
| Icons | `lucide-react`, re-exported through one file | `src/components/shared/icons/index.ts` |
| Date picker | `react-day-picker` | `OpportunityFilters/DateRangeFilter.tsx` |
| Testing | Vitest + Testing Library, jsdom | `vite.config.ts`, `src/tests/setup.ts` |
| Linting | ESLint 10, `typescript-eslint`, React Hooks/Refresh plugins | `eslint.config.js` |

No CSS framework or component library is used — plain CSS, one stylesheet per
component/page, colocated with its `.tsx` file.

---

## Quick start

```bash
git clone https://github.com/sashavershkova/wevolunteer-frontend.git
cd wevolunteer-frontend
npm install
cp .env.example .env.local   # fill in Cognito + API values — see Environment variables
npm run dev
```

```
http://localhost:5173
```

The app needs a reachable backend (`VITE_API_URL`) and a working Cognito app client to do
anything beyond render the login screen.

---

## Table of contents

1. [Repository layout](#repository-layout)
2. [Local development](#local-development)
3. [Environment variables](#environment-variables)
4. [Authentication overview](#authentication-overview)
5. [Routing overview](#routing-overview)
6. [Role-based volunteer and organization experience](#role-based-volunteer-and-organization-experience)
7. [Volunteer features](#volunteer-features)
8. [Organization features](#organization-features)
9. [Image upload overview](#image-upload-overview)
10. [API communication](#api-communication)
11. [Testing](#testing)
12. [Deployment and recreation requirements](#deployment-and-recreation-requirements)
13. [Known limitations and future work](#known-limitations-and-future-work)
14. [Troubleshooting](#troubleshooting)

---

## Repository layout

```
src/
  assets/       Static images
  components/    common/, forms/, navigation/, opportunities/, organization/,
                registrations/, shared/, volunteer/, dashboard/ — one folder per
                component, each with .tsx, .css, and .test.tsx colocated
  config/env.ts  Single source of truth for import.meta.env access
  contexts/      AuthContext — auth session + resolved user/organization profile
  hooks/         useImageUpload, useTheme
  layouts/       AppLayout — Header + Sidebar + Footer shell around routed pages
  pages/         One folder per route (see Routing overview)
  routes/        AppRoutes, ProtectedRoute, HomeRoute
  services/      api/ (one module per backend resource), auth/ (Cognito helpers)
  tests/         Vitest setup + shared fixtures
  types/         Shared domain types (Opportunity)
  utils/         Pure functions: filtering, sorting, formatting, validation
index.html       Vite entry HTML; also the pre-paint theme bootstrap script
vite.config.ts    Vite + Vitest configuration
```

Every component/page directory follows the same pattern: `Name.tsx`, `Name.css`,
`Name.test.tsx`.

---

## Local development

### Prerequisites

- **Node.js** — not pinned in this repository (no `engines` field in `package.json`, no
  `.nvmrc`/`.node-version`). Use a current supported Long-Term Support (LTS) release.
- **npm** (ships with Node), **Git**
- A running instance of the [WeVolunteer backend](https://github.com/sashavershkova/wevolunteer-backend),
  reachable at whatever URL you put in `VITE_API_URL` — there is no mock/offline API mode.
- A Cognito app client — see [Environment variables](#environment-variables).

### Install and run

```bash
npm install
cp .env.example .env.local   # then edit .env.local
npm run dev
```

### Available scripts

| Command | Does |
|---|---|
| `npm run dev` | Starts the Vite dev server at `http://localhost:5173` |
| `npm run build` | Type-checks (`tsc -b`) then builds a static production bundle to `dist/` |
| `npm run preview` | Serves the built `dist/` folder locally |
| `npm run lint` | Runs ESLint over the project |
| `npm test` | Runs the full Vitest suite once and exits |
| `npm run test:watch` | Runs Vitest in watch mode |
| `npm run test:ui` | Opens Vitest's browser test UI |

`npm run build` succeeds on `main` and produces `dist/`. Vite may warn that the JS bundle
is large after minification since there is no route-level code splitting — this is not
blocking. Run `npm run lint` before committing. Known lint issues should be tracked and
resolved separately rather than assumed fixed.

---

## Environment variables

```bash
cp .env.example .env.local
```

All six variables are read in one place, `src/config/env.ts`, via `import.meta.env`. Vite
only exposes variables prefixed `VITE_` to client code:

| Variable | Used for |
|---|---|
| `VITE_COGNITO_AUTHORITY` | Cognito user pool issuer URL (`react-oidc-context` `authority`) |
| `VITE_COGNITO_CLIENT_ID` | Cognito app client ID |
| `VITE_COGNITO_REDIRECT_URI` | Hosted UI sign-in callback (must be registered on the app client) |
| `VITE_COGNITO_LOGOUT_URI` | Hosted UI sign-out redirect (must also be registered) |
| `VITE_COGNITO_DOMAIN` | Hosted UI domain, used to build the `/signup` and `/logout` URLs directly |
| `VITE_API_URL` | Base URL of the backend REST API |

This README does not reproduce actual values from `.env.example` or `.env.local` — set
them to match your own Cognito app client and backend deployment. There is no startup
validation: a missing variable surfaces later as a broken redirect or a failed request,
not a clear error at boot.

---

## Authentication overview

Authentication is Amazon Cognito's Hosted UI via the OAuth2/OIDC Authorization Code flow,
implemented with `react-oidc-context`.

- `src/main.tsx` wraps the app in `react-oidc-context`'s `AuthProvider`, configured from
  `src/services/auth/cognitoConfig.ts`. A small callback handler strips the leftover
  `?code=...&state=...` query params from the URL right after sign-in, which avoids a
  known React-StrictMode double-processing issue in development.
- `src/contexts/AuthContext.tsx` wraps the raw OIDC session and additionally resolves
  *which* profile (volunteer or organization) belongs to the signed-in identity, by
  calling `GET /users/me` and, if that 404s, `GET /organizations/me`. All pages read auth
  state through `useAppAuth()`.
- `ProtectedRoute` gates every route except `/login`: it shows a loading state, an
  auth-error state, or `LoginPage`, and only renders a page once the profile lookup above
  has finished — so a page never mistakes "not fetched yet" for "no profile."
- Sign in, sign up, and sign out all redirect to Cognito's Hosted UI.
- **No token refresh / silent renew is configured** — see
  [Known limitations](#known-limitations-and-future-work).
- The access token is sent as `Authorization: Bearer <token>` on every API call; no other
  auth headers or cookies are used.

---

## Routing overview

Routing is entirely client-side (`react-router-dom`, `BrowserRouter`); there is no
server-side rendering. All routes are declared in `src/routes/AppRoutes.tsx`:

| Area | Routes |
|---|---|
| Public | `/login` |
| Volunteer | `/dashboard`, `/opportunities`, `/opportunities/:id`, `/my-registrations`, `/profile`, `/favorites`, `/messages`*, `/settings`* |
| Organization | `/organization`, `/organization/opportunities` (+ `new`, `/:id`, `/:id/edit`), `/organization/registrations`, `/organization/volunteers`, `/organization/messages`*, `/organization/profile`, `/organization/settings`* |
| Root | `/` (`HomeRoute`) redirects to `/organization` or `/dashboard` depending on which profile exists |

\* Placeholder pages — see [Features](#features).

All routes except `/login` sit under `ProtectedRoute` and then `AppLayout` (header,
sidebar, footer). There is no route-level code splitting — every page ships in one JS
bundle.

`OnboardingPage` exists but is **not** a route: `DashboardPage` and `OpportunitiesPage`
render it inline whenever the signed-in identity has no volunteer/organization profile
yet, so a first-time user sees the onboarding form in place of that page's normal content.

---

## Role-based volunteer and organization experience

One route tree and layout serve both roles. `AuthContext`'s resolved `userProfile` /
`organizationProfile` decides everything:

- The sidebar shows volunteer or organization navigation items based on which profile is
  set (and nothing while neither is resolved yet).
- `HomeRoute` and several individual pages redirect to the correct area if the wrong
  profile type is signed in (e.g. an organization identity visiting `/opportunities` is
  sent to `/organization`).
- This is a **frontend UX convenience only** — actual authorization is enforced by the
  backend, not by this routing logic.

---

## Volunteer features

- **Browse opportunities** — search, filter by category/location/organization/date range,
  register, favorite, and join/leave a waitlist once an opportunity is full.
- **My Registrations** — all of a volunteer's registrations, with its own filter set.
- **Favorites** — saved opportunities, with the same filtering and register/waitlist
  actions as Browse.
- **Dashboard** — upcoming registrations and a computed hours-contributed metric.
- **Profile** — edit name (email is fixed to the Cognito identity), upload a profile
  photo, view a profile-completion checklist.

---

## Organization features

- **Dashboard** — opportunity metrics and an upcoming-opportunities list.
- **Opportunity management** — create, edit, close, reopen, and delete opportunities
  (title, description, category, location, date/time, capacity, a "what you'll do" list,
  recurring flag, and an optional image).
- **Registrations** — per-opportunity registrant and waitlist lists, with filtering.
- **Volunteer directory** — registrations aggregated client-side into one row per
  volunteer, with search/filter/sort (there is no dedicated backend endpoint for this).
- **Organization profile** — edit details, upload a logo, profile-completion and
  verification-status previews.

---

## Image upload overview

Volunteer profile photos, organization logos, and opportunity images all share the same
flow:

1. **Validate locally** (JPEG/PNG/WebP, 5 MB max) — mirrors the backend's own rules, but
   the backend re-validates independently; this is a UX convenience, not the enforcement
   point.
2. **Request a pre-signed upload URL** from the backend.
3. **`PUT` the file directly to S3** using that URL — image bytes never pass through the
   backend.
4. **Confirm the upload** with a `PATCH` call that attaches the object key; the response
   includes a fresh, time-limited pre-signed URL for display, not the durable S3 key.

A shared hook (`useImageUpload`) and field component (`ImageUploadField`) back all three
flows, showing a local preview immediately and dropping it if the upload fails.

---

## API communication

Every backend call lives in `src/services/api/` — one module per resource
(`opportunityService`, `organizationService`, `userService`, `registrationService`,
`favoriteService`, `waitlistService`, `imageService`), each a set of plain functions
wrapping `fetch` against `${VITE_API_URL}<path>`. Callers pass the access token
explicitly and it's sent as `Authorization: Bearer <token>`; there is no shared
interceptor. Each function checks `response.ok` and throws a plain `Error` (image
endpoints try to surface the backend's own JSON message first). There is no retry logic,
request cancellation, or caching layer — a `fetch` either resolves or throws.

---

## Testing

Vitest + React Testing Library, jsdom environment (`vite.config.ts`,
`src/tests/setup.ts`). Nearly every component, page, hook, service, and utility function
has a colocated test file.

Verified in this environment:

```bash
npm test -- --run
```

**79 test files, 920 tests, all passing.** No AWS credentials or running backend are
needed — API calls are mocked at the `fetch` level.

```bash
npm run build
```

**Succeeds**, producing a static `dist/` bundle.

---

## Deployment and recreation requirements

The frontend is a static React/Vite application — `npm run build` produces `dist/`
(`index.html` + hashed assets) that any static host can serve. Because routing is entirely
client-side (`BrowserRouter`), the host must rewrite unmatched paths to `index.html`
rather than returning 404s.

Production hosting currently uses **AWS Amplify**. Amplify's build settings and
environment variables are managed in the Amplify console, not committed to this
repository — there is no `amplify.yml` or Amplify IaC checked in here, so this repository
cannot recreate the Amplify application automatically. If the AWS resources are deleted,
the Amplify app, its build configuration, and its environment variables must be set up
again by hand, using the steps below.

The frontend requires all six `VITE_*` environment variables (see
[Environment variables](#environment-variables)) to be set in Amplify's environment
variable configuration, not just locally. After recreating any AWS infrastructure, the
Cognito callback/logout URLs, the backend's CORS configuration, the S3 image bucket's
CORS configuration, and `VITE_API_URL` must all be updated to match the new resources —
see the checklist below.

### Recreating frontend infrastructure — checklist

1. Recreate or identify the Cognito user pool and app client.
2. Configure Hosted UI callback and logout URLs for `localhost:5173` and the deployed
   frontend origin.
3. Deploy the backend and identify its public API URL. *(Obtain from the new backend
   deployment — do not reuse an old URL.)*
4. Configure the backend's CORS to allow the frontend's origin.
5. Configure the S3 image bucket's CORS to allow browser `PUT`/`GET` requests from the
   frontend's origin.
6. Create the AWS Amplify application and connect it to this GitHub repository's `main`
   branch.
7. Add all six `VITE_*` environment variables in Amplify. *(Values come from the newly
   created Cognito app client and backend — not from any value previously committed or
   documented.)*
8. Set the Amplify build command to `npm run build` and the output directory to `dist`.
9. Configure a single-page-application rewrite so unmatched paths serve `index.html`.
10. Deploy, then verify sign-in, routing, API calls, and image uploads end-to-end.

---

## Known limitations and future work

- **Messages** (volunteer and organization) is a "Coming Soon" placeholder with no backend
  integration.
- **Most of Settings** (notifications, integrations, security, data & privacy) is a
  "Coming Soon" placeholder for both roles.
- **Notifications are not implemented** in the frontend — the header bell is disabled.
- **No token refresh / silent renew is configured** — a long-lived session's access token
  will eventually expire with no automatic re-authentication.
- **No route-level code splitting** — the app ships as a single JS bundle.
- **Opportunity filtering is performed client-side.** The frontend fetches all open
  opportunities and filters/sorts them in the browser rather than sending filter
  parameters to the backend.
- **Deployment configuration is managed outside this repository** (AWS Amplify console) —
  see [Deployment and recreation requirements](#deployment-and-recreation-requirements).

---

## Troubleshooting

**Blank page / stuck on "Loading..."** — Usually `.env.local` is missing or
`VITE_COGNITO_AUTHORITY` is unreachable; `ProtectedRoute` shows "Loading..." while the app
waits on Cognito's OIDC discovery endpoint.

**"No matching state found in storage" after signing in** — A stale `code`/`state` still
in the URL (e.g. a manual refresh mid-flow). Start the sign-in flow again from `/login`.

**API calls fail with a network or CORS error** — Confirm `VITE_API_URL` points at a
running backend, and that the backend's CORS allow-list includes the origin you're serving
the frontend from.

**Stuck on the onboarding form after signing in** — Expected the first time a given
identity signs in: `GET /users/me` and `GET /organizations/me` both 404 until a profile is
created. Submitting the onboarding form creates it.

**Image upload fails** — The upload is a multi-step round trip (pre-signed URL → `PUT` to
S3 → `PATCH` to attach). Check the allowed type/size first (JPEG/PNG/WebP, 5 MB) — most
failures here are validation rejections, not network issues.
