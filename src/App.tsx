import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireRole } from "./components/RequireRole";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AssessmentBuilderPage } from "./pages/AssessmentBuilderPage";
import { ClassesPage } from "./pages/ClassesPage";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PasswordChangePage } from "./pages/PasswordChangePage";
import { StudentAssessmentPage } from "./pages/StudentAssessmentPage";
import { StudentDashboardPage } from "./pages/StudentDashboardPage";
import { StudentResultsPage } from "./pages/StudentResultsPage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<PasswordChangePage />} />
      <Route element={<AppShell />}>
        <Route
          path="/teacher"
          element={
            <RequireRole roles={["admin", "teacher"]}>
              <TeacherDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <RequireRole roles={["admin", "teacher"]}>
              <ClassesPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/assessments/new"
          element={
            <RequireRole roles={["admin", "teacher"]}>
              <AssessmentBuilderPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/analytics"
          element={
            <RequireRole roles={["admin", "teacher"]}>
              <AnalyticsPage />
            </RequireRole>
          }
        />
        <Route
          path="/student"
          element={
            <RequireRole roles={["student"]}>
              <StudentDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/student/assessments/:assessmentId"
          element={
            <RequireRole roles={["student"]}>
              <StudentAssessmentPage />
            </RequireRole>
          }
        />
        <Route
          path="/student/results/:assessmentId"
          element={
            <RequireRole roles={["student"]}>
              <StudentResultsPage />
            </RequireRole>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
