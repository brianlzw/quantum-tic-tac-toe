import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initGA, trackPageView } from './utils/analytics'

// Initialize Google Analytics
initGA()

// Track initial page view - wait a bit for script to load
setTimeout(() => {
  trackPageView(window.location.pathname);
}, 1000);

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
