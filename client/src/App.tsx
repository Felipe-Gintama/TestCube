import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MainLayout from './layouts/MainLayout';

export default function App() {
  const token = localStorage.getItem("token");

  return (
    // <BrowserRouter>
    //   <nav>
    //     <Link to="/register">Rejestracja</Link>
    //     <Link to="/login">Logowanie</Link>
    //   </nav>
    //   <Routes>
    //     <Route path="/register" element={<RegisterPage />} />
    //     <Route path="/login" element={<LoginPage />} />
    //     <Route path="/dashboard" element={<DashboardPage />} />
    //   </Routes>
    // </BrowserRouter>
    
    <BrowserRouter>
      <Routes>
        {/* default public routers */}
        <Route element={<MainLayout/>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        
        {/* securited */}
        <Route element={ token ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* redirect */}
        <Route path="/" element={token ? <Navigate to="/dashboard" replace/> : <Navigate to="/login" replace/>} />
      </Routes>
    </BrowserRouter>

  );
}
