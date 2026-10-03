import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import { App } from './app'
import './styles.css'

const root = document.querySelector('#root')
if (!root) throw new Error('Missing application root')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
