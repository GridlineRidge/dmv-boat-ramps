import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import RampPage from './pages/RampPage'
import StatePage from './pages/StatePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/ramp/:id" element={<RampPage />} />
        <Route path="/state/:stateName" element={<StatePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
