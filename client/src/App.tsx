// import React from 'react'
// import Home from './pages/Home'

// function App() {
//   return <Home />
// }

// export default App

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
//import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/register">Rejestracja</Link>
        {/* <Link to="/login">Logowanie</Link> */}
      </nav>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        {/* <Route path="/login" element={<LoginPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
