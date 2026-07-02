
/** WHY: React entry point. Mounts the app and global providers to the DOM. */
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { GoogleOAuthProvider } from '@react-oauth/google'
import '../index.css'
import App from './App.jsx'

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <GoogleOAuthProvider clientId={GOOGLE_ID}>
      <App />
    </GoogleOAuthProvider>
  </HelmetProvider>
)

