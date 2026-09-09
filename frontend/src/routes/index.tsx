import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import RoleRoute from './RoleRoute'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage'
import StudentDashboard from '@/pages/student/StudentDashboard'
import StudentRecommendations from '@/pages/student/StudentRecommendations'
import InternshipDetail from '@/pages/student/InternshipDetail'
import InternshipSearch from '@/pages/student/InternshipSearch'
import SavedInternshipsPage from '@/pages/student/SavedInternshipsPage'
import ProfilePage from '@/pages/student/ProfilePage'
import RecommendationHistoryPage from '@/pages/student/RecommendationHistoryPage'
import ApplicationHistoryPage from '@/pages/student/ApplicationHistoryPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminStudentManagement from '@/pages/admin/AdminStudentManagement'
import AdminInternshipReview from '@/pages/admin/AdminInternshipReview'
import AdminDataSourceHealth from '@/pages/admin/AdminDataSourceHealth'
import AdminAIMonitoring from '@/pages/admin/AdminAIMonitoring'
import Navbar from '@/components/layout/Navbar'

export default function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />

        {/* Auth routes - public but redirect authenticated users */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-email/:uid/:token" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

        {/* Social Auth OAuth callback routes */}
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* Protected student routes */}
        <Route
          path="/dashboard"
          element={
            <RoleRoute allowedRoles={['student']}>
              <StudentDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <RoleRoute allowedRoles={['student']}>
              <StudentRecommendations />
            </RoleRoute>
          }
        />
        <Route path="/recommendations/history" element={<RoleRoute allowedRoles={['student']}><RecommendationHistoryPage /></RoleRoute>} />
        <Route path="/applications/history" element={<RoleRoute allowedRoles={['student']}><ApplicationHistoryPage /></RoleRoute>} />
        <Route
          path="/internships/:id"
          element={
            <RoleRoute allowedRoles={['student']}>
              <InternshipDetail />
            </RoleRoute>
          }
        />
        <Route
          path="/internships"
          element={
            <RoleRoute allowedRoles={['student']}>
              <InternshipSearch />
            </RoleRoute>
          }
        />
        <Route
          path="/search"
          element={
            <RoleRoute allowedRoles={['student']}>
              <InternshipSearch />
            </RoleRoute>
          }
        />
        <Route
          path="/saved"
          element={
            <RoleRoute allowedRoles={['student']}>
              <SavedInternshipsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/saved-internships"
          element={
            <RoleRoute allowedRoles={['student']}>
              <SavedInternshipsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminStudentManagement />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/internships/review"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminInternshipReview />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/data-sources"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDataSourceHealth />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/ai-monitoring"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminAIMonitoring />
            </RoleRoute>
          }
        />
      </Routes>
    </>
  )
}
