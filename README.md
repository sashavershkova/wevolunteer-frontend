# WeVolunteer Frontend

React + TypeScript frontend for the WeVolunteer capstone project.

The frontend provides the user interface for volunteers and organizations to browse volunteer opportunities, manage registrations, and administer volunteer events. It communicates with the Spring Boot backend through a REST API and uses Amazon Cognito for authentication.

---

## Current Status

The frontend currently includes:

- React + TypeScript + Vite
- Amazon Cognito authentication
- Protected routes
- React Router
- Environment-based configuration

Application features are currently under development.

---

## Tech Stack

- React
- TypeScript
- Vite
- Amazon Cognito
- Spring Boot REST API
- AWS

---

## Prerequisites

Before running the application, install:

- Node.js (v22 or newer LTS recommended)
- npm
- Git
- Visual Studio Code (recommended)

---

## Quick Start

1. Clone the repository

```bash
git clone https://github.com/sashavershkova/wevolunteer-frontend.git
cd wevolunteer-frontend
```

2. Install dependencies

```bash
npm install
```

3. Create your local environment file

```bash
cp .env.example .env.local
```

4. Start the development server

```bash
npm run dev
```

5. Open the application

```text
http://localhost:5173
```

---

## Backend

The frontend communicates with the WeVolunteer Spring Boot backend.

Before testing the frontend, make sure the backend is running locally.

The default backend URL is configured through the environment variables:

```text
http://localhost:8080
```

---


## Environment Variables

Create a local environment file before running the application:

```bash
cp .env.example .env.local
```

The default values in `.env.example` are configured for local development and the shared capstone AWS resources.

---

## Authentication

Authentication is implemented using Amazon Cognito.

Current functionality:

- Hosted UI sign in
- Hosted UI sign out
- Protected routes
- React authentication context

The authenticated user's Cognito identity is available throughout the application via the shared Auth Context.

---

## Project Structure

```text
src/
├── assets/          # Images and static assets
├── components/      # Reusable UI components
├── config/          # Environment configuration
├── contexts/        # React Context providers
├── hooks/           # Custom React hooks
├── layouts/         # Shared page layouts
├── pages/           # Application pages
├── routes/          # Routing and protected routes
├── services/        # API and authentication services
├── styles/          # Global styles
├── types/           # Shared TypeScript types
└── utils/           # Helper functions
```

## Available Scripts

Start development server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

Preview production build locally:

```bash
npm run preview
```

---

## Roadmap

Planned MVP features include:

- User profile creation after Cognito authentication
- Browse volunteer opportunities
- Opportunity filtering
- Opportunity details
- Volunteer registrations
- Organization dashboard
- Opportunity management
- Responsive design

---

## Team

WeVolunteer is the Cloud Capstone project for Ada Developers Academy C25.