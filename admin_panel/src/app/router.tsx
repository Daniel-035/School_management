import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { UsersPage } from "@/features/users/UsersPage";
import { AcademicsPage } from "@/features/academics/AcademicsPage";
import { FeesPage } from "@/features/fees/FeesPage";
import { CalendarPage } from "@/features/calendar/CalendarPage";
import { AnnouncementsPage } from "@/features/announcements/AnnouncementsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { NotFoundPage } from "@/features/errors/NotFoundPage";
import { ForbiddenPage } from "@/features/errors/ForbiddenPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/403", element: <ForbiddenPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "academics", element: <AcademicsPage /> },
      { path: "fees", element: <FeesPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "announcements", element: <AnnouncementsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
