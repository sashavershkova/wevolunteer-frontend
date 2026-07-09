import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context'
import './index.css'
import App from './App.tsx'
import { cognitoAuthConfig } from './services/auth/cognitoConfig.ts'
import { AuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OidcAuthProvider {...cognitoAuthConfig}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </OidcAuthProvider>
  </StrictMode>,
)