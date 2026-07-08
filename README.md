# WeVolunteer Frontend

React + TypeScript frontend for the WeVolunteer capstone project.

The frontend provides the user interface for volunteers and organizations to browse volunteer opportunities, manage registrations, and administer volunteer events. It communicates with the Spring Boot backend through a REST API and uses Amazon Cognito for authentication.

---

## Current Status

The frontend has been initialized with:

- React
- TypeScript
- Vite
- ESLint

Authentication and application features are currently under development.

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

## Clone the repository

```bash
git clone https://github.com/sashavershkova/wevolunteer-frontend.git
cd wevolunteer-frontend
```

---

## Install dependencies

```bash
npm install
```

---

## Running the application

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

---

## Backend

The frontend communicates with the WeVolunteer Spring Boot backend.

Before testing the frontend, make sure the backend is running locally.

Default backend URL:

```text
http://localhost:8080
```

---

## Authentication

Authentication is provided by Amazon Cognito.

Supported user roles:

- Volunteer
- Organization

Cognito integration is currently in progress.

---

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

- User authentication with Amazon Cognito
- Volunteer registration and login
- Organization registration and login
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