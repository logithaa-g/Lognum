import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import NumGuess from './pages/NumGuess.jsx'
import BullsCows from './pages/BullsCows.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/"           element={<Home />} />
      <Route path="/numguess"   element={<NumGuess />} />
      <Route path="/bullscows"  element={<BullsCows />} />
    </Routes>
  )
}
