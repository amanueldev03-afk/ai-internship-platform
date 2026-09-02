import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { logoutUser } from '@/features/auth/authSlice'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, role, user, isLoading } = useAppSelector((state) => state.auth)

  if (!isAuthenticated || role !== 'student') {
    return null
  }

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    await dispatch(logoutUser(refreshToken))
    navigate('/login')
  }

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/recommendations', label: 'AI Matches' },
    { path: '/internships', label: 'Browse Internships' },
    { path: '/saved', label: 'Saved' },
    { path: '/profile', label: 'Profile & Resume' },
  ]

  const isActive = (path: string) => {
    if (path === '/internships') {
      return location.pathname === '/internships' || location.pathname === '/search' || location.pathname.startsWith('/internships/')
    }
    if (path === '/saved') {
      return location.pathname === '/saved' || location.pathname === '/saved-internships'
    }
    return location.pathname === path
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Brand + Navigation Links */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-indigo-600 hover:text-indigo-700">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-lg">AI</span>
              <span>InternMatch</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: User Email + Logout Button */}
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className="text-xs text-gray-500 hover:text-indigo-600 hidden sm:block font-medium"
            >
              {user?.email}
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-red-700 bg-gray-100 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? '...' : 'Sign out'}
            </button>
          </div>
        </div>

        {/* Mobile secondary bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-gray-100 gap-1 scrollbar-none">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`whitespace-nowrap px-3 py-1 text-xs rounded-full transition-colors ${
                isActive(link.path)
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
