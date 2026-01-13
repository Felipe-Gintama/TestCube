import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MainLayout from "./layouts/MainLayout";
import ProjectsPage from "./pages/ProjectsPage";
import NewProjectForm from "./pages/NewProjectForm";
import AddMemberToProject from "./pages/AddMemberToProject";
import TestCasesPage from "./pages/TestCasesManagemet";
import TestPlanUIPrototype from "./pages/TestPlanManager";
import TestingPage from "./pages/TestingPage";
import ExecuteTestPage from "./pages/ExecuteTestPage";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* default public routers */}
        <Route element={<MainLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* securited */}
        <Route
          element={token ? <MainLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* project manage*/}
          <Route path="/projects" element={<ProjectsPage />}>
            <Route path="new" element={<NewProjectForm />} />
            <Route path="members" element={<AddMemberToProject />} />
          </Route>

          <Route path="/testCasesManagement" element={<TestCasesPage />} />
          <Route path="/testPlans" element={<TestPlanUIPrototype />} />
          <Route path="/testing" element={<TestingPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route
            path="/execute-test/:testId/:runId"
            element={<ExecuteTestPage />}
          />
        </Route>

        {/* redirect */}
        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
