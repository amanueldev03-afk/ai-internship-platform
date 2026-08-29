import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'

// Routes are added here as pages are built out.
// Protected routes (requiring auth) will wrap with a PrivateRoute component.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* Auth */}
      {/* <Route path="/login" element={<LoginPage />} /> */}
      {/* <Route path="/register" element={<RegisterPage />} /> */}
      {/* Student */}
      {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
      {/* <Route path="/internships" element={<InternshipsPage />} /> */}
      {/* <Route path="/recommendations" element={<RecommendationsPage />} /> */}
      {/* Admin */}
      {/* <Route path="/admin/dashboard" element={<AdminDashboardPage />} /> */}
    </Routes>
  )
}
