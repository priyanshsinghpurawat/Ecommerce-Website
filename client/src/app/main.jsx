/** WHY: React entry point. Mounts the app and global providers to the DOM. */
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import '../index.css'
import App from './App.jsx'

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_ID}>
    <App />
  </GoogleOAuthProvider>
)
