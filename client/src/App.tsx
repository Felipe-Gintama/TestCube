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
import UserManagementPage from "./pages/UserManagementPage";
import RequireAuth from "./auth/RequireAuth";
import CreateGithubIssue from "./pages/GithubIssuePage";
import GithubIssuePage from "./pages/GithubIssuePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route element={<MainLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* PRIVATE */}
        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/projects" element={<ProjectsPage />}>
              <Route path="new" element={<NewProjectForm />} />
              <Route path="members" element={<AddMemberToProject />} />
            </Route>

            <Route path="/testCasesManagement" element={<TestCasesPage />} />
            <Route path="/testPlans" element={<TestPlanUIPrototype />} />
            <Route path="/testing" element={<TestingPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/issues" element={<GithubIssuePage />} />
            <Route
              path="/execute-test/:testId/:runId"
              element={<ExecuteTestPage />}
            />
          </Route>
        </Route>

        {/* DEFAULT */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
