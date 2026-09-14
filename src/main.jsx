import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './App.css'
import App from './App.jsx'
import { LeadsProvider } from './lib/LeadsContext'
import { InvoiceProvider } from './lib/InvoiceContext'
import { InboxProvider } from './lib/InboxContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LeadsProvider>
        <InvoiceProvider>
          <InboxProvider>
            <App />
          </InboxProvider>
        </InvoiceProvider>
      </LeadsProvider>
    </BrowserRouter>
  </StrictMode>,
)
