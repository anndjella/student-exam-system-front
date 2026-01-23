import { createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { LoginPage } from "../auth/LoginPage";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { HomeRedirect } from "./HomeRedirect";
import { ChangePasswordPage } from "../auth/ChangePasswordPage";

import { MePage } from "../features/me/pages/MePage";
import { StudentLayout } from "../features/student/layout/StudentLayout";
import { StudServiceLayout } from "../features/student-service/layout/StudServiceLayout";
import { TeacherLayout } from "../features/teacher/layout/TeacherLayout";
import { StudentSubjectsPage } from "../features/student/pages/StudentSubjectsPage";
// import { St } from "../features/student/pages/StudentExamsPage";
import {HomePage} from "../features/home/HomePage"

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/change-password",
    element: (
      <ProtectedRoute allowWhenMustChangePassword>
        <ChangePasswordPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <HomeRedirect />
      </ProtectedRoute>
    ),
  },

  {
    path: "/student",
    element: (
      <ProtectedRoute>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="home" replace /> },
    { path: "home", element: <HomePage /> },
    { path: "subjects", element: <StudentSubjectsPage /> },
     { path: "me", element: <MePage /> },
    ],
  },
  {
    path: "/teacher",
   element: (
      <ProtectedRoute>
        <TeacherLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="home" replace /> },
    { path: "home", element: <HomePage /> },
     { path: "me", element: <MePage /> },
    ],
  },
  {
    path: "/ss",
    element: (
      <ProtectedRoute>
        <StudServiceLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="home" replace /> },
    { path: "home", element: <HomePage /> },
     { path: "me", element: <MePage /> },
    ],
  }
]);
