import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import './index.css'
import App from './App.tsx'
import { cognitoAuthConfig } from './services/auth/cognitoConfig.ts'
import { AppAuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <AppAuthProvider>
        <App />
      </AppAuthProvider>
    </AuthProvider>
  </StrictMode>,
)