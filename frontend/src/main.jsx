import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/dashboard.css'
import 'bootstrap/dist/css/bootstrap.min.css' // Load Bootstrap CSS
import 'bootstrap/dist/js/bootstrap.bundle.min.js' // Load Bootstrap JS (for dropdowns/modals)
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)