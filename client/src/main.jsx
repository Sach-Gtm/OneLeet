import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { reloadOnceForStaleChunk } from './lib/reloadOnce'
import { installGlobalErrorReporting } from './lib/telemetry'

// Capture uncaught errors + promise rejections to our own backend (audit C3),
// so silent production crashes on real phones become visible in the admin panel.
installGlobalErrorReporting()

// Vite fires `vite:preloadError` when a lazy-route chunk fails to load — which
// happens to an open tab after a new deploy swaps the hashed filenames. Reload
// once (guarded + deferred) to fetch the fresh chunk manifest instead of leaving
// the user on a blank screen.
window.addEventListener('vite:preloadError', () => {
  reloadOnceForStaleChunk()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
