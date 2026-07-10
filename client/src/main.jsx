import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { reloadOnceForStaleChunk } from './lib/reloadOnce'

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
