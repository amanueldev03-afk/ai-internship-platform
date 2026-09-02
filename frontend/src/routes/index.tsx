import { Routes, Route, useNavigate } from 'react-router-dom'
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
import ProfilePage from '@/pages/student/ProfilePage'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { logoutUser } from '@/features/auth/authSlice'

const AdminDashboard = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)
  const { isLoading } = useAppSelector((state) => state.auth)

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    await dispatch(logoutUser(refreshToken))
    navigate('/login')
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Welcome, {user?.email}</span>
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
      <p>Admin dashboard content will be implemented in later tasks.</p>
    </div>
  )
}

export default function AppRoutes() {
  return (
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
      <Route
        path="/internships/:id"
        element={
          <RoleRoute allowedRoles={['student']}>
            <InternshipDetail />
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
    </Routes>
  )
}
