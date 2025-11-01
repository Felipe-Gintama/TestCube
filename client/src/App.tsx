import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MainLayout from './layouts/MainLayout';
import ProjectsPage from './pages/ProjectsPage';

export default function App() {
  const token = localStorage.getItem("token");

  return (
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
          <Route path="/projects" element={<ProjectsPage />} />
        </Route>

        {/* redirect */}
        <Route path="/" element={token ? <Navigate to="/dashboard" replace/> : <Navigate to="/login" replace/>} />
      </Routes>
    </BrowserRouter>

  );
}
