import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Dashboard from "./pages/student/Dashboard";
import Placeholder from "./pages/student/Placeholder";
import { fetchProfile } from "./store/authSlice";
import Courses from "./pages/student/Courses";
import CourseDetails from "./pages/student/CourseDetails";
import CreateCourse from "./pages/instructor/CreateCourse";
import ManageCourses from "./pages/instructor/ManageCourses";
import MyCourses from "./pages/student/MyCourses";
import LessonPlayer from "./pages/LessonPlayer";
import Quizzes from "./pages/student/Quizzes";
import QuizAttempt from "./pages/student/QuizAttempt";
import InstructorQuizzes from "./pages/instructor/InstructorQuizzes";
import QuizEditor from "./pages/instructor/QuizEditor";
import LiveClasses from "./pages/LiveClasses";
import InstructorStudents from "./pages/instructor/InstructorStudents";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageCoursesAdmin from "./pages/admin/ManageCoursesAdmin";

function AppRoutes() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (token) {
        try {
          await dispatch(fetchProfile()).unwrap();
        } catch {
          // Invalid token: authSlice clears the session.
        }
      }

      setCheckingSession(false);
    };

    restoreSession();
  }, [dispatch, token]);

  if (checkingSession) {
    return <div className="loading-screen">Loading LearnHub...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="my-courses" element={<MyCourses />} />
        <Route path="courses/:id" element={<CourseDetails />} />
        <Route
          path="create-course"
          element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <CreateCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-courses"
          element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <ManageCourses />
            </ProtectedRoute>
          }
        />
        <Route path="learn/:courseId" element={<LessonPlayer />} />
        <Route path="live-classes" element={<LiveClasses />} />
        <Route path="quizzes" element={<Quizzes />} />
        <Route path="quizzes/:courseId/:quizId" element={<QuizAttempt />} />
        <Route
          path="instructor/quizzes"
          element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <InstructorQuizzes />
            </ProtectedRoute>
          }
        />
        <Route
          path="instructor/quizzes/create"
          element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <QuizEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="instructor/quizzes/edit/:quizId"
          element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <QuizEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="students"
          element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <InstructorStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/courses"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageCoursesAdmin />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
