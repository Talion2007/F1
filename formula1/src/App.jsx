import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Home from './pages/Home';
import Drivers from './pages/Drivers';
import Sprints from './pages/Sprints';
import Pratices from './pages/Pratices';
import Qualifying from './pages/Qualify';
import './App.css'

function App() {

  return (
    <>
    <Analytics/>
    <SpeedInsights/>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/sprints" element={<Sprints />} />
          <Route path="/pratices" element={<Pratices />} />
          <Route path="/qualifying" element={<Qualifying />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
