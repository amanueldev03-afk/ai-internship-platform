import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'

interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function PublicRoute({ children, redirectTo }: PublicRouteProps) {
  const { isAuthenticated, isInitialized, user, role } = useAppSelector((state) => state.auth)

  // Show loading state while auth is initializing to prevent premature redirect
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-sm text-gray-500">Checking authentication...</span>
        </div>
      </div>
    )
  }

  // Redirect authenticated users away from public auth pages to their role dashboard
  if (isAuthenticated) {
    const currentRole = role || user?.role
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />
    }
    if (currentRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
