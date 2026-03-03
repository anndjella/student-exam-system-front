import { createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { LoginPage } from "../auth/LoginPage";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { HomeRedirect } from "./HomeRedirect";
import { ChangePasswordPage } from "../auth/ChangePasswordPage";
import { RequireRole } from "../auth/RequireRole";


import { MePage } from "../features/shared/pages/MePage";
import { StudentLayout } from "../features/student/layout/StudentLayout";
import { StudServiceLayout } from "../features/student-service/layout/StudServiceLayout";
import { TeacherLayout } from "../features/teacher/layout/TeacherLayout";
import { StudentSubjectsPage } from "../features/student/pages/StudentSubjectsPage";
import { StudentExamsPage } from "../features/student/pages/StudentExamsPage";
import {HomePage} from "../features/home/HomePage"
import {StudentServiceSubjectsPage} from "../features/student-service/pages/SubjectsPage"
import {StudentRegistrationsPage} from "../features/student/pages/StudentRegistrationsPage"
import { TeacherSubjectsPage } from "../features/teacher/pages/TeacherSubjectsPage";
import {TermsPage} from "../features/shared/pages/TermsPage"
import { SSStudentsPage } from "../features/student-service/pages/StudentsPage";
import { TeacherStudentsPage } from "../features/teacher/pages/StudentsPage";
import { TeachersPage } from "../features/student-service/pages/TeachersPage";
import { EnrollmentsPage } from "../features/student-service/pages/EnrollmentsPage";
import { ExamsPage} from "../features/student-service/pages/ExamsPage";
import { RegistrationsPage} from "../features/student-service/pages/RegistrationsPage";

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
        <RequireRole allowed={["Student"]} />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <StudentLayout />,
        children: [
          { index: true, element: <Navigate to="home" replace /> },
          { path: "home", element: <HomePage /> },
          { path: "terms", element: <TermsPage /> },
          { path: "exams", element: <StudentExamsPage /> },
          { path: "subjects", element: <StudentSubjectsPage /> },
          { path: "registrations", element: <StudentRegistrationsPage /> },
         { path: "me", element: <MePage /> },
        ],
      },
    ],
  },
   {
    path: "/teacher",
    element: (
      <ProtectedRoute>
        <RequireRole allowed={["Teacher"]} />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <TeacherLayout />,
        children: [
          { index: true, element: <Navigate to="home" replace /> },
          { path: "home", element: <HomePage /> },
          { path: "terms", element: <TermsPage /> },
          { path: "students", element: <TeacherStudentsPage /> },
          { path: "subjects", element: <TeacherSubjectsPage /> },        
         { path: "me", element: <MePage /> },
        ],
      },
    ],
  },
  {
    path: "/ss",
    element: (
      <ProtectedRoute>
        <RequireRole allowed={["StudentService"]} />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <StudServiceLayout />,
        children: [
          { index: true, element: <Navigate to="home" replace /> },
          { path: "home", element: <HomePage /> },
          { path: "students", element: <SSStudentsPage /> },
          { path: "teachers", element: <TeachersPage /> },
          { path: "enrollments", element: <EnrollmentsPage /> },
          { path: "registrations", element: <RegistrationsPage /> },
          { path: "exams", element: <ExamsPage /> },
          { path: "terms", element: <TermsPage /> },
          { path: "subjects", element: <StudentServiceSubjectsPage /> },
         { path: "me", element: <MePage /> },
        ],
      },
    ],
  },
]);
